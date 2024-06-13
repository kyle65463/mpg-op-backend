import assert from "assert";
import { randomUUID } from "crypto";
import { beforeEach, describe, it } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";

import { formatComment } from "@/models/comment";
import { Comment } from "@/models/comment";
import { formatPost, Post } from "@/models/post";
import { CommentRepo, RawComment } from "@/repos/commentRepo";
import { ListPostsOrderBy, PostRepo, RawPost } from "@/repos/postRepo";
import { decodeNextKey, encodeNextKey } from "@/utils/api/pagination";
import { RepoError } from "@/utils/error/repo";
import { ServiceError } from "@/utils/error/service";

import {
  CreatePostRequest,
  DeletePostRequest,
  GetPostRequest,
  LikePostRequest,
  ListPostsRequest,
  ListPostsRequestQuery,
  UnlikePostRequest,
} from "./schema";
import { createPostService, PostService } from "./service";

const mockUserId = randomUUID();

const mockRawPost: RawPost = {
  id: randomUUID(),
  title: "post name",
  content: "content",
  likeCount: 0,
  authorId: mockUserId,
  createdAt: new Date(),
  deletedAt: null,
};

const mockPost = formatPost(mockRawPost);

describe("PostService", () => {
  let repo: MockProxy<PostRepo>;
  let commentRepo: MockProxy<CommentRepo>;
  let service: PostService;

  beforeEach(async () => {
    repo = mock<PostRepo>();
    commentRepo = mock<CommentRepo>();
    service = createPostService({ postRepo: repo, commentRepo });
  });

  describe("getPost", () => {
    let req: GetPostRequest;

    beforeEach(() => {
      req = {
        id: mockPost.id,
      };
    });

    describe("normal case", () => {
      beforeEach(async () => {
        repo.get.mockResolvedValue(mockRawPost);
      });

      it("should return post", async ({ expect }) => {
        const post = await service.getPost(req);
        expect(post).toEqual(mockPost);
      });

      it("should call repo", async ({ expect }) => {
        await service.getPost(req);
        expect(repo.get).toHaveBeenCalledWith(req.id);
      });
    });

    describe("with comments", () => {
      let mockRawComments: RawComment[];
      let mockComments: Comment[];

      beforeEach(async () => {
        mockRawComments = [
          {
            id: randomUUID(),
            content: "comment 1",
            postId: mockPost.id,
            parentId: null,
            authorId: randomUUID(),
            createdAt: new Date(),
            deletedAt: null,
          },
          {
            id: randomUUID(),
            content: "comment 2",
            postId: mockPost.id,
            parentId: null,
            authorId: randomUUID(),
            createdAt: new Date(),
            deletedAt: null,
          },
        ];
        mockComments = mockRawComments.map(formatComment);

        repo.get.mockResolvedValue(mockRawPost);
        commentRepo.list.mockResolvedValue(mockRawComments);
      });

      beforeEach(() => {
        req.withComments = true;
      });

      it("should return post with comments", async ({ expect }) => {
        const post = await service.getPost(req);
        expect(post).toEqual({
          ...mockPost,
          comments: mockComments,
        });
      });

      it("should call repos", async ({ expect }) => {
        await service.getPost(req);
        expect(repo.get).toHaveBeenCalledWith(req.id);
        expect(commentRepo.list).toHaveBeenCalledWith({ postId: req.id });
      });
    });

    describe("when post does not exist", () => {
      beforeEach(async () => {
        repo.get.mockRejectedValue(RepoError.NotFound);
      });

      it("should throw error", async ({ expect }) => {
        await expect(service.getPost(req)).rejects.toThrowError(
          ServiceError.PostNotFound,
        );
      });
    });
  });

  describe("createPost", () => {
    let req: CreatePostRequest;

    beforeEach(() => {
      req = {
        content: mockPost.content,
        title: mockPost.title,
        userId: mockPost.authorId,
      };
    });

    describe("normal case", () => {
      beforeEach(async () => {
        repo.create.mockResolvedValue();
      });

      it("should succeed", async ({ expect }) => {
        await expect(service.createPost(req)).resolves.not.toThrow();
      });

      it("should call repo", async ({ expect }) => {
        await service.createPost(req);
        expect(repo.create).toHaveBeenCalledWith({
          content: req.content,
          title: req.title,
          userId: req.userId,
        });
      });
    });
  });

  describe("listPosts", () => {
    let req: ListPostsRequest;
    let query: ListPostsRequestQuery;
    let mockRawPosts: RawPost[];
    let mockPosts: Post[];

    beforeEach(() => {
      query = {
        orderBy: ListPostsOrderBy.LikeCountDesc,
        limit: 3,
      };
    });

    beforeEach(() => {
      mockRawPosts = [];
      for (let i = 0; i < 3; i++) {
        mockRawPosts.push({
          id: randomUUID(),
          title: `post ${i}`,
          content: "content",
          likeCount: 5 - i,
          authorId: randomUUID(),
          createdAt: new Date(),
          deletedAt: null,
        });
      }

      mockPosts = mockRawPosts.map((post) => formatPost(post));
    });

    describe("with options", () => {
      beforeEach(async () => {
        req = {
          ...query,
        };

        repo.list.mockResolvedValue(mockRawPosts);
      });

      it("should return list", async ({ expect }) => {
        const { items } = await service.listPosts(req);
        expect(items).toEqual(mockPosts);
      });

      it("should return next key", async ({ expect }) => {
        const { nextKey } = await service.listPosts(req);
        assert(nextKey);

        const decodedOptions = decodeNextKey(nextKey, ListPostsRequestQuery);
        expect(decodedOptions).toEqual({
          limit: query.limit,
          orderBy: query.orderBy,
          cursor: mockRawPosts[2].id,
        });
      });

      it("should call repo", async ({ expect }) => {
        await service.listPosts(req);
        expect(repo.list).toHaveBeenCalledWith({
          limit: query.limit,
          orderBy: query.orderBy,
        });
      });
    });

    describe("with next key", () => {
      describe("normal case", () => {
        beforeEach(async () => {
          req = {
            nextKey: encodeNextKey(query),
          };

          repo.list.mockResolvedValue(mockRawPosts);
        });

        it("should return list", async ({ expect }) => {
          const { items } = await service.listPosts(req);
          expect(items).toEqual(mockPosts);
        });

        it("should return next key", async ({ expect }) => {
          const { nextKey } = await service.listPosts(req);
          assert(nextKey);

          const decodedOptions = decodeNextKey(nextKey, ListPostsRequestQuery);
          expect(decodedOptions).toEqual({
            limit: query.limit,
            orderBy: query.orderBy,
            cursor: mockRawPosts[2].id,
          });
        });

        it("should call repo", async ({ expect }) => {
          await service.listPosts(req);
          expect(repo.list).toHaveBeenCalledWith({
            limit: query.limit,
            orderBy: query.orderBy,
          });
        });
      });

      describe("when no more data", () => {
        beforeEach(async () => {
          req = {
            nextKey: encodeNextKey(query),
          };

          repo.list.mockResolvedValue([]);
        });

        it("should return empty posts", async ({ expect }) => {
          const { items } = await service.listPosts(req);
          expect(items).toEqual([]);
        });

        it("should return null next key", async ({ expect }) => {
          const { nextKey } = await service.listPosts(req);
          expect(nextKey).toEqual(null);
        });

        it("should call repo", async ({ expect }) => {
          await service.listPosts(req);
          expect(repo.list).toHaveBeenCalledWith({
            limit: query.limit,
            orderBy: query.orderBy,
          });
        });
      });
    });
  });

  describe("deletePost", () => {
    let req: DeletePostRequest;

    beforeEach(() => {
      req = {
        id: mockPost.id,
        userId: mockPost.authorId,
      };
    });

    describe("normal case", () => {
      beforeEach(async () => {
        repo.delete.mockResolvedValue();
      });

      it("should succeed", async ({ expect }) => {
        await expect(service.deletePost(req)).resolves.not.toThrow();
      });

      it("should call repo", async ({ expect }) => {
        await service.deletePost(req);
        expect(repo.delete).toHaveBeenCalledWith(req.id, req.userId);
      });
    });

    describe("when post does not exist", () => {
      beforeEach(async () => {
        repo.delete.mockRejectedValue(RepoError.NotFound);
      });

      it("should throw error", async ({ expect }) => {
        await expect(service.deletePost(req)).rejects.toThrowError(
          ServiceError.PostNotFound,
        );
      });
    });

    describe("when delete post with wrong user id", () => {
      beforeEach(async () => {
        repo.delete.mockRejectedValue(RepoError.NoPermission);
      });

      it("should throw error", async ({ expect }) => {
        await expect(service.deletePost(req)).rejects.toThrowError(
          ServiceError.NoPermission,
        );
      });
    });
  });

  describe("likePost", () => {
    let req: LikePostRequest;

    beforeEach(() => {
      req = {
        id: mockPost.id,
        userId: mockPost.authorId,
      };
    });

    describe("normal case", () => {
      beforeEach(async () => {
        repo.like.mockResolvedValue();
      });

      it("should succeed", async ({ expect }) => {
        await expect(service.likePost(req)).resolves.not.toThrow();
      });

      it("should call repo", async ({ expect }) => {
        await service.likePost(req);
        expect(repo.like).toHaveBeenCalledWith(req.id, req.userId);
      });
    });

    describe("when post does not exist", () => {
      beforeEach(async () => {
        repo.like.mockRejectedValue(RepoError.NotFound);
      });

      it("should throw error", async ({ expect }) => {
        await expect(service.likePost(req)).rejects.toThrowError(
          ServiceError.PostNotFound,
        );
      });
    });

    describe("when post is already liked", () => {
      beforeEach(async () => {
        repo.like.mockRejectedValue(RepoError.Duplicated);
      });

      it("should throw error", async ({ expect }) => {
        await expect(service.likePost(req)).rejects.toThrowError(
          ServiceError.PostAlreadyLiked,
        );
      });
    });
  });

  describe("unlikePost", () => {
    let req: UnlikePostRequest;

    beforeEach(() => {
      req = {
        id: mockPost.id,
        userId: mockPost.authorId,
      };
    });

    describe("normal case", () => {
      beforeEach(async () => {
        repo.unlike.mockResolvedValue();
      });

      it("should succeed", async ({ expect }) => {
        await expect(service.unlikePost(req)).resolves.not.toThrow();
      });

      it("should call repo", async ({ expect }) => {
        await service.unlikePost(req);
        expect(repo.unlike).toHaveBeenCalledWith(req.id, req.userId);
      });
    });

    describe("when post does not exist", () => {
      beforeEach(async () => {
        repo.unlike.mockRejectedValue(RepoError.NotFound);
      });

      it("should throw error", async ({ expect }) => {
        await expect(service.unlikePost(req)).rejects.toThrowError(
          ServiceError.PostNotFound,
        );
      });
    });

    describe("when post is not liked", () => {
      beforeEach(async () => {
        repo.unlike.mockRejectedValue(RepoError.PostNotLiked);
      });

      it("should throw error", async ({ expect }) => {
        await expect(service.unlikePost(req)).rejects.toThrowError(
          ServiceError.PostNotLiked,
        );
      });
    });
  });
});
