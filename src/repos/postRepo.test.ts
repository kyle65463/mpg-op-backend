import { PrismaClient } from "@prisma/pg/index";
import { randomUUID } from "crypto";
import { beforeAll, beforeEach, describe, it } from "vitest";

import { RawComment } from "./commentRepo";
import {
  CreatePostData,
  createPostRepo,
  ListPostsOptions,
  ListPostsOrderBy,
  PostRepo,
} from "./postRepo";
import { RawPost } from "./postRepo";
import { RepoError } from "../utils/error/repo";

const mockPost: RawPost = {
  id: randomUUID(),
  title: "post",
  content: "content",
  likeCount: 0,
  authorId: randomUUID(),
  createdAt: new Date(),
  deletedAt: null,
};

const mockComment: RawComment = {
  id: randomUUID(),
  content: "content",
  postId: mockPost.id,
  parentId: null,
  authorId: randomUUID(),
  createdAt: new Date(),
  deletedAt: null,
};

async function seedPost(db: PrismaClient, post: RawPost) {
  await db.post.create({
    data: {
      ...post,
    },
  });
}

async function seedPostLike(db: PrismaClient, postId: string, userId: string) {
  await db.postLike.create({
    data: {
      postId,
      userId,
    },
  });
}

async function seedComment(db: PrismaClient, comment: RawComment) {
  await db.comment.create({
    data: {
      ...comment,
    },
  });
}

describe("PostRepo", () => {
  let db: PrismaClient;
  let repo: PostRepo;

  beforeAll(async () => {
    db = new PrismaClient({});
    repo = createPostRepo(db);
  });

  beforeEach(async () => {
    await db.post.deleteMany();
    await db.postLike.deleteMany();
  });

  describe("get", () => {
    let id: string;

    beforeEach(() => {
      id = mockPost.id;
    });

    describe("normal case", () => {
      beforeEach(async () => {
        await seedPost(db, mockPost);
      });

      it("should return post", async ({ expect }) => {
        const post = await repo.get(id);
        expect(post).toMatchObject(mockPost);
      });
    });

    describe("when post does not exist", () => {
      it("should throw error", async ({ expect }) => {
        await expect(repo.get(id)).rejects.toThrowError(RepoError.NotFound);
      });
    });
  });

  describe("create", () => {
    let options: CreatePostData;

    beforeEach(() => {
      options = {
        title: mockPost.title,
        content: mockPost.content,
        userId: mockPost.authorId,
      };
    });

    describe("normal case", () => {
      it("should succeed", async ({ expect }) => {
        await expect(repo.create(options)).resolves.not.toThrow();
      });

      it("should create post in db", async ({ expect }) => {
        await repo.create(options);
        const post = await db.post.findFirst();
        expect(post).toMatchObject({
          ...mockPost,
          id: expect.any(String),
          createdAt: expect.any(Date),
        });
      });
    });
  });

  describe("list", () => {
    let options: ListPostsOptions;
    let mockPosts: RawPost[];

    beforeEach(() => {
      options = {
        orderBy: ListPostsOrderBy.CreatedAtDesc,
        limit: 3,
      };
    });

    beforeEach(async () => {
      mockPosts = [];
      for (let i = 0; i < 3; i++) {
        mockPosts.push({
          id: randomUUID(),
          title: `post ${i}`,
          content: "content",
          likeCount: 5 - i,
          authorId: randomUUID(),
          createdAt: new Date(2001, 1, i),
          deletedAt: null,
        });
      }

      for (const mockPost of mockPosts) {
        await seedPost(db, mockPost);
      }
    });

    describe("normal case", () => {
      it("should return list", async ({ expect }) => {
        const posts = await repo.list(options);
        expect(posts).toMatchObject([mockPosts[2], mockPosts[1], mockPosts[0]]);
      });
    });

    describe("with cursor", () => {
      beforeEach(() => {
        options.cursor = mockPosts[1].id;
      });

      it("should return list", async ({ expect }) => {
        const posts = await repo.list(options);
        expect(posts).toMatchObject([mockPosts[0]]);
      });
    });

    describe("with orderBy", () => {
      describe("when orderBy is likeCount desc", () => {
        beforeEach(() => {
          options.orderBy = ListPostsOrderBy.LikeCountDesc;
        });

        it("should return list", async ({ expect }) => {
          const posts = await repo.list(options);
          expect(posts).toMatchObject([
            mockPosts[0],
            mockPosts[1],
            mockPosts[2],
          ]);
        });
      });

      describe("when orderBy is createdAt desc", () => {
        beforeEach(() => {
          options.orderBy = ListPostsOrderBy.CreatedAtDesc;
        });

        it("should return list", async ({ expect }) => {
          const posts = await repo.list(options);
          expect(posts).toMatchObject([
            mockPosts[2],
            mockPosts[1],
            mockPosts[0],
          ]);
        });
      });
    });

    describe("with authorId", () => {
      beforeEach(() => {
        options.authorId = mockPosts[0].authorId;
      });

      it("should return list", async ({ expect }) => {
        const posts = await repo.list(options);
        expect(posts).toMatchObject([mockPosts[0]]);
      });
    });
  });

  describe("delete", () => {
    let id: string;
    let userId: string;

    beforeEach(() => {
      id = mockPost.id;
      userId = mockPost.authorId;
    });

    describe("normal case", () => {
      beforeEach(async () => {
        await seedPost(db, mockPost);
        await seedComment(db, mockComment);
      });

      it("should succeed", async ({ expect }) => {
        await expect(repo.delete(id, userId)).resolves.not.toThrow();
      });

      it("should delete post in db", async ({ expect }) => {
        await repo.delete(id, userId);
        const count = await db.post.count({ where: { deletedAt: null } });
        expect(count).toBe(0);
      });

      it("should delete comment in db", async ({ expect }) => {
        await repo.delete(id, userId);
        const count = await db.comment.count({ where: { deletedAt: null } });
        expect(count).toBe(0);
      });
    });

    describe("when post does not exist", () => {
      it("should throw error", async ({ expect }) => {
        await expect(repo.delete(id, userId)).rejects.toThrowError(
          RepoError.NotFound,
        );
      });
    });

    describe("when delete post with wrong user id", () => {
      beforeEach(async () => {
        await seedPost(db, mockPost);
        userId = randomUUID();
      });

      it("should throw error", async ({ expect }) => {
        await expect(repo.delete(id, userId)).rejects.toThrowError(
          RepoError.NoPermission,
        );
      });
    });
  });

  describe("like", () => {
    let id: string;
    let userId: string;

    beforeEach(() => {
      id = mockPost.id;
      userId = randomUUID();
    });

    describe("normal case", () => {
      beforeEach(async () => {
        await seedPost(db, mockPost);
      });

      it("should succeed", async ({ expect }) => {
        await expect(repo.like(id, userId)).resolves.not.toThrow();
      });

      it("should increase likeCount in db", async ({ expect }) => {
        await repo.like(id, userId);
        const post = await db.post.findFirst();
        expect(post).toMatchObject({ ...mockPost, likeCount: 1 });
      });

      it("should create like in db", async ({ expect }) => {
        await repo.like(id, userId);
        const like = await db.postLike.findFirst();
        expect(like).toMatchObject({ postId: id, userId: userId });
      });
    });

    describe("when post does not exist", () => {
      it("should throw error", async ({ expect }) => {
        await expect(repo.like(id, userId)).rejects.toThrowError(
          RepoError.NotFound,
        );
      });
    });

    describe("when post is already liked", () => {
      beforeEach(async () => {
        await seedPost(db, mockPost);
        await seedPostLike(db, id, userId);
      });

      it("should throw error", async ({ expect }) => {
        await expect(repo.like(id, userId)).rejects.toThrowError(
          RepoError.Duplicated,
        );
      });
    });
  });

  describe("unlike", () => {
    let id: string;
    let userId: string;

    beforeEach(() => {
      id = mockPost.id;
      userId = randomUUID();
    });

    describe("normal case", () => {
      beforeEach(async () => {
        await seedPost(db, mockPost);
        await seedPostLike(db, id, userId);
      });

      it("should succeed", async ({ expect }) => {
        await expect(repo.unlike(id, userId)).resolves.not.toThrow();
      });

      it("should decrease likeCount in db", async ({ expect }) => {
        await repo.unlike(id, userId);
        const post = await db.post.findFirst();
        expect(post).toMatchObject({
          ...mockPost,
          likeCount: mockPost.likeCount - 1,
        });
      });

      it("should delete like in db", async ({ expect }) => {
        await repo.unlike(id, userId);
        const count = await db.postLike.count();
        expect(count).toBe(0);
      });
    });

    describe("when post does not exist", async () => {
      it("should throw error", async ({ expect }) => {
        await expect(repo.unlike(id, userId)).rejects.toThrowError(
          RepoError.NotFound,
        );
      });
    });

    describe("when post is not liked", async () => {
      beforeEach(async () => {
        await seedPost(db, mockPost);
      });

      it("should throw error", async ({ expect }) => {
        await expect(repo.unlike(id, userId)).rejects.toThrowError(
          RepoError.PostNotLiked,
        );
      });
    });
  });
});
