import { PrismaClient } from "@prisma/pg/index";
import { randomUUID } from "crypto";
import { beforeAll, beforeEach, describe, it } from "vitest";

import {
  CommentRepo,
  CreateCommentData,
  createCommentRepo,
  ListCommentsOptions,
  RawComment,
} from "./commentRepo";
import { RawPost } from "./postRepo";
import { RepoError } from "../utils/error/repo";

const mockPost: RawPost = {
  id: randomUUID(),
  title: "title",
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
    data: post,
  });
}

async function seedComment(db: PrismaClient, comment: RawComment) {
  await db.comment.create({
    data: comment,
  });
}

describe("CommentRepo", () => {
  let db: PrismaClient;
  let repo: CommentRepo;

  beforeAll(async () => {
    db = new PrismaClient({});
    repo = createCommentRepo(db);
  });

  beforeEach(async () => {
    await db.post.deleteMany();
    await db.comment.deleteMany();
  });

  describe("create", () => {
    let data: CreateCommentData;

    describe("normal case", () => {
      beforeEach(async () => {
        await seedPost(db, mockPost);
      });

      describe("without parentId", () => {
        beforeEach(() => {
          data = {
            content: mockComment.content,
            postId: mockPost.id,
            userId: mockComment.authorId,
          };
        });

        it("should succeed", async ({ expect }) => {
          await expect(repo.create(data)).resolves.not.toThrow();
        });

        it("should create post in db", async ({ expect }) => {
          await repo.create(data);
          const comment = await db.comment.findFirst();
          expect(comment).toMatchObject({
            ...mockComment,
            id: expect.any(String),
            postId: mockPost.id,
            createdAt: expect.any(Date),
          });
        });
      });

      describe("with parentId", () => {
        let mockParentComment: RawComment;

        beforeEach(async () => {
          mockParentComment = {
            ...mockComment,
            id: randomUUID(),
            content: "parent content",
            postId: mockPost.id,
            parentId: null,
          };

          await seedComment(db, mockParentComment);
        });

        beforeEach(async () => {
          data = {
            content: mockComment.content,
            postId: mockPost.id,
            parentId: mockParentComment.id,
            userId: mockComment.authorId,
          };
        });

        it("should succeed", async ({ expect }) => {
          await expect(repo.create(data)).resolves.not.toThrow();
        });

        it("should create post in db", async ({ expect }) => {
          await repo.create(data);
          const comment = await db.comment.findFirst({
            where: { parentId: mockParentComment.id },
          });
          expect(comment).toMatchObject({
            ...mockComment,
            id: expect.any(String),
            postId: mockPost.id,
            parentId: mockParentComment.id,
            createdAt: expect.any(Date),
          });
        });
      });
    });

    describe("when post does not exist", () => {
      beforeEach(() => {
        data = {
          content: mockComment.content,
          postId: mockComment.postId,
          userId: mockComment.authorId,
        };
      });

      it("should throw error", async ({ expect }) => {
        await expect(repo.create(data)).rejects.toThrowError(
          RepoError.PostNotFound,
        );
      });
    });

    describe("when parent comment not found", () => {
      beforeEach(async () => {
        await seedPost(db, mockPost);
      });

      beforeEach(() => {
        data = {
          content: mockComment.content,
          postId: mockPost.id,
          parentId: randomUUID(),
          userId: mockComment.authorId,
        };
      });

      it("should throw error", async ({ expect }) => {
        await expect(repo.create(data)).rejects.toThrowError(
          RepoError.NotFound,
        );
      });
    });

    describe("when post and parent comment do not match", () => {
      let mockParentComment: RawComment;

      beforeEach(async () => {
        mockParentComment = {
          ...mockComment,
          id: randomUUID(),
          content: "parent content",
          postId: mockPost.id,
          parentId: null,
        };

        await seedPost(db, mockPost);
        await seedComment(db, mockParentComment);
      });

      beforeEach(async () => {
        data = {
          content: mockComment.content,
          postId: randomUUID(), // different post id
          parentId: mockParentComment.id,
          userId: mockComment.authorId,
        };
      });

      it("should throw error", async ({ expect }) => {
        await expect(repo.create(data)).rejects.toThrowError(
          RepoError.ParentCommentNotMatchWithPost,
        );
      });
    });

    describe("when comment on a subcomment", () => {
      let mockParentComment: RawComment;
      let mockSubcomment: RawComment;

      beforeEach(async () => {
        mockParentComment = {
          ...mockComment,
          id: randomUUID(),
          content: "parent content",
          postId: mockPost.id,
          parentId: null,
        };
        mockSubcomment = {
          ...mockComment,
          id: randomUUID(),
          content: "subcomment",
          postId: mockPost.id,
          parentId: mockParentComment.id,
        };

        await seedPost(db, mockPost);
        await seedComment(db, mockParentComment);
        await seedComment(db, mockSubcomment);
      });

      beforeEach(async () => {
        data = {
          content: mockComment.content,
          postId: mockPost.id,
          parentId: mockSubcomment.id,
          userId: mockComment.authorId,
        };
      });

      it("should throw error", async ({ expect }) => {
        await expect(repo.create(data)).rejects.toThrowError(
          RepoError.CommentOnSubcomment,
        );
      });
    });
  });

  describe("list", () => {
    let options: ListCommentsOptions;
    let mockComments: RawComment[];

    describe("normal case", () => {
      beforeEach(async () => {
        await seedPost(db, mockPost);
      });

      describe("without parent id", () => {
        beforeEach(async () => {
          mockComments = [
            {
              id: randomUUID(),
              content: "content",
              postId: mockPost.id,
              parentId: null,
              authorId: randomUUID(),
              createdAt: new Date(2000, 1, 1),
              deletedAt: null,
            },
            {
              id: randomUUID(),
              content: "content",
              postId: mockPost.id,
              parentId: null,
              authorId: randomUUID(),
              createdAt: new Date(2000, 1, 2),
              deletedAt: null,
            },
            {
              id: randomUUID(),
              content: "content",
              postId: mockPost.id,
              parentId: null,
              authorId: randomUUID(),
              createdAt: new Date(2000, 1, 3),
              deletedAt: null,
            },
          ];

          for (const mockComment of mockComments) {
            await seedComment(db, mockComment);
          }
        });

        beforeEach(() => {
          options = {
            postId: mockPost.id,
          };
        });

        describe("normal case", () => {
          it("should return list", async ({ expect }) => {
            const comments = await repo.list(options);
            expect(comments).toMatchObject([
              mockComments[2],
              mockComments[1],
              mockComments[0],
            ]);
          });
        });

        describe("with cursor", () => {
          beforeEach(() => {
            options.cursor = mockComments[1].id;
          });

          it("should return list", async ({ expect }) => {
            const comments = await repo.list(options);
            expect(comments).toMatchObject([mockComments[0]]);
          });
        });
      });

      describe("with parent id", () => {
        let parentId: string;

        beforeEach(async () => {
          parentId = randomUUID();
          mockComments = [
            {
              id: randomUUID(),
              content: "content",
              postId: mockPost.id,
              parentId: parentId,
              authorId: randomUUID(),
              createdAt: new Date(2000, 1, 3),
              deletedAt: null,
            },
            {
              id: randomUUID(),
              content: "content",
              postId: mockPost.id,
              parentId: parentId,
              authorId: randomUUID(),
              createdAt: new Date(2000, 1, 2),
              deletedAt: null,
            },
            {
              id: randomUUID(),
              content: "content",
              postId: mockPost.id,
              parentId: parentId,
              authorId: randomUUID(),
              createdAt: new Date(2000, 1, 1),
              deletedAt: null,
            },
          ];

          for (const mockComment of mockComments) {
            await seedComment(db, mockComment);
          }
        });

        beforeEach(() => {
          options = {
            postId: mockPost.id,
            parentId,
          };
        });

        describe("normal case", () => {
          it("should return list", async ({ expect }) => {
            const comments = await repo.list(options);
            expect(comments).toMatchObject(mockComments);
          });
        });

        describe("with cursor", () => {
          beforeEach(() => {
            options.cursor = mockComments[1].id;
          });

          it("should return list", async ({ expect }) => {
            const comments = await repo.list(options);
            expect(comments).toMatchObject([mockComments[2]]);
          });
        });
      });
    });

    describe("when post does not exist", () => {
      beforeEach(() => {
        options = {
          postId: randomUUID(),
        };
      });

      it("should throw error", async ({ expect }) => {
        await expect(repo.list(options)).rejects.toThrowError(
          RepoError.PostNotFound,
        );
      });
    });
  });

  describe("delete", () => {
    let id: string;
    let userId: string;

    beforeEach(() => {
      id = mockComment.id;
      userId = mockComment.authorId;
    });

    describe("normal case", () => {
      beforeEach(async () => {
        await seedPost(db, mockPost);
        await seedComment(db, mockComment);
        await seedComment(db, {
          ...mockComment,
          id: randomUUID(),
          content: "subcomment",
          parentId: mockComment.id,
        });
      });

      it("should succeed", async ({ expect }) => {
        await expect(repo.delete(id, userId)).resolves.not.toThrow();
      });

      it("should delete comment and subcomment in db", async ({ expect }) => {
        await repo.delete(id, userId);
        const count = await db.comment.count({ where: { deletedAt: null } });
        expect(count).toBe(0);
      });
    });

    describe("when comment does not exist", () => {
      it("should throw error", async ({ expect }) => {
        await expect(repo.delete(id, userId)).rejects.toThrowError(
          RepoError.NotFound,
        );
      });
    });

    describe("when delete comment with wrong user id", () => {
      beforeEach(async () => {
        await seedPost(db, mockPost);
        await seedComment(db, mockComment);
        userId = randomUUID();
      });

      it("should throw error", async ({ expect }) => {
        await expect(repo.delete(id, userId)).rejects.toThrowError(
          RepoError.NoPermission,
        );
      });
    });
  });
});
