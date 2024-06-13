import {
  Comment as PrismaComment,
  Prisma,
  PrismaClient,
} from "@prisma/pg/index";

import { handlePrismaError, PrismaError } from "@/utils/error/prisma";

import { defaultLimit, RepoError } from "../utils/error/repo";

export type RawComment = PrismaComment;

const handleError = handlePrismaError({
  [PrismaError.UniqueConstraint]: RepoError.Duplicated,
  [PrismaError.NotFound]: RepoError.NotFound,
  [PrismaError.ForeignKeyConstraint]: RepoError.PostNotFound,
});

const handlePostNotFoundError = handlePrismaError({
  [PrismaError.NotFound]: RepoError.PostNotFound,
});

export interface ListCommentsOptions {
  postId?: string;
  parentId?: string;
  limit?: number;
  cursor?: string;
}

export interface CreateCommentData {
  content: string;
  postId: string;
  parentId?: string;
  userId: string;
}

export function createCommentRepo(db: PrismaClient) {
  return {
    create: async (data: CreateCommentData): Promise<void> => {
      if (data.parentId) {
        const parentComment = await db.comment
          .findUniqueOrThrow({ where: { id: data.parentId, deletedAt: null } })
          .catch(handleError);

        if (parentComment.postId !== data.postId) {
          throw RepoError.ParentCommentNotMatchWithPost;
        }

        if (parentComment.parentId !== null) {
          throw RepoError.CommentOnSubcomment;
        }
      }

      await db.comment
        .create({
          data: {
            content: data.content,
            postId: data.postId,
            parentId: data.parentId,
            authorId: data.userId,
          },
        })
        .catch(handleError);
    },

    list: async (options: ListCommentsOptions): Promise<RawComment[]> => {
      await db.post
        .findUniqueOrThrow({ where: { id: options.postId } })
        .catch(handlePostNotFoundError);

      let query: Prisma.CommentFindManyArgs;
      if (options.parentId) {
        query = {
          where: {
            postId: options.postId,
            parentId: options.parentId,
            deletedAt: null,
          },
        };
      } else {
        query = {
          where: {
            postId: options.postId,
            parentId: null,
            deletedAt: null,
          },
        };
      }

      query.orderBy = [{ createdAt: "desc" }, { id: "desc" }];

      if (options.cursor) {
        query.cursor = {
          id: options.cursor,
        };
        query.skip = 1;
      }

      const comments = await db.comment.findMany({
        where: query.where,
        orderBy: query.orderBy,
        cursor: query.cursor,
        skip: query.skip,
        take: options.limit ?? defaultLimit,
      });

      return comments;
    },

    delete: async (id: string, userId: string): Promise<void> => {
      await db.$transaction(async (tx) => {
        const comment = await tx.comment
          .findUniqueOrThrow({ where: { id, deletedAt: null } })
          .catch(handleError);

        if (comment.authorId !== userId) {
          throw RepoError.NoPermission;
        }

        const now = new Date();
        await tx.comment.update({
          where: { id },
          data: { deletedAt: now },
        });

        if (comment.parentId === null) {
          await tx.comment.updateMany({
            where: { parentId: id },
            data: { deletedAt: now },
          });
        }
      });
    },
  };
}

export type CommentRepo = ReturnType<typeof createCommentRepo>;
