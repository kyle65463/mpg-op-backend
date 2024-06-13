import assert from "assert";
import { randomUUID } from "crypto";
import { beforeEach, describe, it } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";

import { Comment, formatComment } from "@/models/comment";
import { CommentRepo, RawComment } from "@/repos/commentRepo";
import { decodeNextKey, encodeNextKey } from "@/utils/api/pagination";
import { RepoError } from "@/utils/error/repo";
import { ServiceError } from "@/utils/error/service";

import {
  CreateCommentRequest,
  DeleteCommentRequest,
  ListCommentsRequest,
  ListCommentsRequestQuery,
} from "./schema";
import { CommentService, createCommentService } from "./service";

const mockUserId = randomUUID();

const mockRawComment: RawComment = {
  id: randomUUID(),
  content: "content",
  postId: randomUUID(),
  parentId: null,
  authorId: mockUserId,
  createdAt: new Date(),
  deletedAt: null,
};

const mockComment = formatComment(mockRawComment);

describe("CommentService", () => {
  let repo: MockProxy<CommentRepo>;
  let service: CommentService;

  beforeEach(async () => {
    repo = mock<CommentRepo>();
    service = createCommentService({ commentRepo: repo });
  });

  describe("createComment", () => {
    let req: CreateCommentRequest;

    beforeEach(() => {
      req = {
        content: mockComment.content,
        postId: mockComment.postId,
        parentId: mockComment.parentId ?? undefined,
        userId: mockUserId,
      };
    });

    describe("normal case", () => {
      beforeEach(async () => {
        repo.create.mockResolvedValue();
      });

      it("should succeed", async ({ expect }) => {
        await expect(service.createComment(req)).resolves.not.toThrow();
      });

      it("should call repo", async ({ expect }) => {
        await service.createComment(req);
        expect(repo.create).toHaveBeenCalledWith({
          content: req.content,
          postId: req.postId,
          parentId: req.parentId,
          userId: req.userId,
        });
      });
    });

    describe("when comment not found", () => {
      beforeEach(async () => {
        repo.create.mockRejectedValue(RepoError.NotFound);
      });

      it("should throw error", async ({ expect }) => {
        await expect(service.createComment(req)).rejects.toThrowError(
          ServiceError.CommentNotFound,
        );
      });
    });

    describe("when post not found", () => {
      beforeEach(async () => {
        repo.create.mockRejectedValue(RepoError.PostNotFound);
      });

      it("should throw error", async ({ expect }) => {
        await expect(service.createComment(req)).rejects.toThrowError(
          ServiceError.PostNotFound,
        );
      });
    });

    describe("when parent comment not match with post", () => {
      beforeEach(async () => {
        repo.create.mockRejectedValue(RepoError.ParentCommentNotMatchWithPost);
      });

      it("should throw error", async ({ expect }) => {
        await expect(service.createComment(req)).rejects.toThrowError(
          ServiceError.ParentCommentNotMatchWithPost,
        );
      });
    });

    describe("when comment on subcomment", () => {
      beforeEach(async () => {
        repo.create.mockRejectedValue(RepoError.CommentOnSubcomment);
      });

      it("should throw error", async ({ expect }) => {
        await expect(service.createComment(req)).rejects.toThrowError(
          ServiceError.CommentOnSubcomment,
        );
      });
    });
  });

  describe("listComments", () => {
    let req: ListCommentsRequest;
    let query: ListCommentsRequestQuery;
    let mockRawComments: RawComment[];
    let mockComments: Comment[];

    beforeEach(() => {
      mockRawComments = [];
      for (let i = 0; i < 3; i++) {
        mockRawComments.push({
          id: randomUUID(),
          content: "content",
          postId: randomUUID(),
          authorId: randomUUID(),
          parentId: null,
          createdAt: new Date(),
          deletedAt: null,
        });
      }

      mockComments = mockRawComments.map(formatComment);
    });

    describe("without parent id", () => {
      beforeEach(() => {
        query = {
          limit: 3,
          postId: randomUUID(),
        };
      });

      describe("with options", () => {
        beforeEach(() => {
          req = {
            ...query,
          };

          repo.list.mockResolvedValue(mockRawComments);
        });

        it("should return list", async ({ expect }) => {
          const { items } = await service.listComments(req);
          expect(items).toEqual(mockComments);
        });

        it("should return next key", async ({ expect }) => {
          const { nextKey } = await service.listComments(req);
          assert(nextKey);

          const decodedOptions = decodeNextKey(
            nextKey,
            ListCommentsRequestQuery,
          );

          expect(decodedOptions).toEqual({
            limit: query.limit,
            cursor: mockRawComments[2].id,
            postId: query.postId,
          });
        });

        it("should call repo", async ({ expect }) => {
          await service.listComments(req);
          expect(repo.list).toHaveBeenCalledWith({
            limit: query.limit,
            postId: query.postId,
          });
        });
      });

      describe("with next key", () => {
        describe("normal case", () => {
          beforeEach(async () => {
            req = {
              nextKey: encodeNextKey(query),
            };

            repo.list.mockResolvedValue(mockRawComments);
          });

          it("should return list", async ({ expect }) => {
            const { items } = await service.listComments(req);
            expect(items).toEqual(mockComments);
          });

          it("should return next key", async ({ expect }) => {
            const { nextKey } = await service.listComments(req);
            assert(nextKey);

            const decodedOptions = decodeNextKey(
              nextKey,
              ListCommentsRequestQuery,
            );
            expect(decodedOptions).toEqual({
              limit: query.limit,
              cursor: mockRawComments[2].id,
              postId: query.postId,
            });
          });

          it("should call repo", async ({ expect }) => {
            await service.listComments(req);
            expect(repo.list).toHaveBeenCalledWith({
              limit: query.limit,
              postId: query.postId,
            });
          });
        });

        describe("when no more data", () => {
          beforeEach(async () => {
            req = { nextKey: encodeNextKey(query) };

            repo.list.mockResolvedValue([]);
          });

          it("should return empty posts", async ({ expect }) => {
            const { items } = await service.listComments(req);
            expect(items).toEqual([]);
          });

          it("should return null next key", async ({ expect }) => {
            const { nextKey } = await service.listComments(req);
            expect(nextKey).toEqual(null);
          });

          it("should call repo", async ({ expect }) => {
            await service.listComments(req);
            expect(repo.list).toHaveBeenCalledWith({
              limit: query.limit,
              parentId: query.parentId,
              postId: query.postId,
            });
          });
        });
      });
    });

    describe("with parent id", () => {
      beforeEach(() => {
        query = {
          limit: 3,
          parentId: randomUUID(),
          postId: randomUUID(),
        };
      });

      describe("with options", () => {
        beforeEach(() => {
          req = {
            ...query,
          };

          repo.list.mockResolvedValue(mockRawComments);
        });

        it("should return list", async ({ expect }) => {
          const { items } = await service.listComments(req);
          expect(items).toEqual(mockComments);
        });

        it("should return next key", async ({ expect }) => {
          const { nextKey } = await service.listComments(req);
          assert(nextKey);

          const decodedOptions = decodeNextKey(
            nextKey,
            ListCommentsRequestQuery,
          );

          expect(decodedOptions).toEqual({
            limit: query.limit,
            parentId: query.parentId,
            cursor: mockRawComments[2].id,
            postId: query.postId,
          });
        });

        it("should call repo", async ({ expect }) => {
          await service.listComments(req);
          expect(repo.list).toHaveBeenCalledWith({
            limit: query.limit,
            parentId: query.parentId,
            postId: query.postId,
          });
        });
      });

      describe("with next key", () => {
        describe("normal case", () => {
          beforeEach(async () => {
            req = {
              nextKey: encodeNextKey(query),
            };

            repo.list.mockResolvedValue(mockRawComments);
          });

          it("should return list", async ({ expect }) => {
            const { items } = await service.listComments(req);
            expect(items).toEqual(mockComments);
          });

          it("should return next key", async ({ expect }) => {
            const { nextKey } = await service.listComments(req);
            assert(nextKey);

            const decodedOptions = decodeNextKey(
              nextKey,
              ListCommentsRequestQuery,
            );
            expect(decodedOptions).toEqual({
              limit: query.limit,
              parentId: query.parentId,
              cursor: mockRawComments[2].id,
              postId: query.postId,
            });
          });

          it("should call repo", async ({ expect }) => {
            await service.listComments(req);
            expect(repo.list).toHaveBeenCalledWith({
              limit: query.limit,
              parentId: query.parentId,
              postId: query.postId,
            });
          });
        });

        describe("when no more data", () => {
          beforeEach(async () => {
            req = { nextKey: encodeNextKey(query) };

            repo.list.mockResolvedValue([]);
          });

          it("should return empty posts", async ({ expect }) => {
            const { items } = await service.listComments(req);
            expect(items).toEqual([]);
          });

          it("should return null next key", async ({ expect }) => {
            const { nextKey } = await service.listComments(req);
            expect(nextKey).toEqual(null);
          });

          it("should call repo", async ({ expect }) => {
            await service.listComments(req);
            expect(repo.list).toHaveBeenCalledWith({
              limit: query.limit,
              parentId: query.parentId,
              postId: query.postId,
            });
          });
        });
      });
    });

    describe("when post does not exist", () => {
      beforeEach(async () => {
        repo.list.mockRejectedValue(RepoError.PostNotFound);
      });

      beforeEach(() => {
        query = {
          limit: 3,
          postId: randomUUID(),
        };

        req = {
          ...query,
        };
      });

      it("should throw error", async ({ expect }) => {
        await expect(service.listComments(req)).rejects.toThrowError(
          ServiceError.PostNotFound,
        );
      });
    });
  });

  describe("deleteComment", () => {
    let req: DeleteCommentRequest;

    beforeEach(() => {
      req = { id: mockComment.id, userId: mockComment.authorId };
    });

    describe("normal case", () => {
      beforeEach(async () => {
        repo.delete.mockResolvedValue();
      });

      it("should succeed", async ({ expect }) => {
        await expect(service.deleteComment(req)).resolves.not.toThrow();
      });

      it("should call repo", async ({ expect }) => {
        await service.deleteComment(req);
        expect(repo.delete).toHaveBeenCalledWith(req.id, req.userId);
      });
    });

    describe("when comment does not exist", () => {
      beforeEach(async () => {
        repo.delete.mockRejectedValue(RepoError.NotFound);
      });

      it("should throw error", async ({ expect }) => {
        await expect(service.deleteComment(req)).rejects.toThrowError(
          ServiceError.CommentNotFound,
        );
      });
    });

    describe("when delete comment with wrong user id", () => {
      beforeEach(async () => {
        repo.delete.mockRejectedValue(RepoError.NoPermission);
      });

      it("should throw error", async ({ expect }) => {
        await expect(service.deleteComment(req)).rejects.toThrowError(
          ServiceError.NoPermission,
        );
      });
    });
  });
});
