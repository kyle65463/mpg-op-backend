import { Post as PrismaPost, Prisma, PrismaClient } from "@prisma/pg/index";

import { handlePrismaError, PrismaError } from "@/utils/error/prisma";

import { defaultLimit, RepoError } from "../utils/error/repo";

export type RawPost = PrismaPost;

const handleError = handlePrismaError({
  [PrismaError.UniqueConstraint]: RepoError.Duplicated,
  [PrismaError.NotFound]: RepoError.NotFound,
});

const handleUnlikeError = handlePrismaError({
  [PrismaError.NotFound]: RepoError.PostNotLiked,
});

export interface CreatePostData {
  title: string;
  content: string;
  userId: string;
}

export interface ListPostsOptions {
  authorId?: string;
  orderBy?: ListPostsOrderBy;
  limit?: number;
  cursor?: string;
}

export interface LikePostOptions {
  userId: string;
}

export interface UnlikePostOptions {
  userId: string;
}

export enum ListPostsOrderBy {
  LikeCountDesc = "LIKE_DESC",
  CreatedAtDesc = "CREATED_AT_DESC",
}

export function createPostRepo(db: PrismaClient) {
  return {
    get: async (id: string): Promise<RawPost> => {
      const post = await db.post
        .findUniqueOrThrow({ where: { id, deletedAt: null } })
        .catch(handleError);

      return post;
    },

    create: async (data: CreatePostData): Promise<void> => {
      await db.post
        .create({
          data: {
            title: data.title,
            content: data.content,
            authorId: data.userId,
          },
        })
        .catch(handleError);
    },

    list: async (options: ListPostsOptions): Promise<RawPost[]> => {
      const query: Prisma.PostFindManyArgs = {
        where: {
          authorId: options.authorId,
          deletedAt: null,
        },
      };

      if (options.orderBy === ListPostsOrderBy.CreatedAtDesc) {
        query.orderBy = [{ createdAt: "desc" }, { id: "desc" }];
      } else {
        query.orderBy = [{ likeCount: "desc" }, { id: "desc" }];
      }

      if (options.cursor) {
        query.cursor = {
          id: options.cursor,
        };
        query.skip = 1;
      }

      const posts = await db.post.findMany({
        where: query.where,
        orderBy: query.orderBy,
        cursor: query.cursor,
        skip: query.skip,
        take: options.limit ?? defaultLimit,
      });

      return posts;
    },

    delete: async (id: string, userId: string): Promise<void> => {
      await db.$transaction(async (tx) => {
        const post = await tx.post
          .findUniqueOrThrow({
            where: {
              id,
              deletedAt: null,
            },
          })
          .catch(handleError);

        if (post.authorId !== userId) {
          throw RepoError.NoPermission;
        }

        const now = new Date();
        await tx.post.update({
          where: { id },
          data: { deletedAt: now },
        });

        await tx.comment.updateMany({
          where: { postId: id },
          data: { deletedAt: now },
        });
      });
    },

    like: async (id: string, userId: string): Promise<void> => {
      await db.$transaction(async (tx) => {
        const post = await tx.post
          .findUniqueOrThrow({ where: { id, deletedAt: null } })
          .catch(handleError);

        await tx.postLike
          .create({
            data: {
              postId: id,
              userId: userId,
            },
          })
          .catch(handleError);

        await tx.post.update({
          where: { id },
          data: {
            likeCount: post.likeCount + 1,
          },
        });
      });
    },

    unlike: async (id: string, userId: string): Promise<void> => {
      await db.$transaction(async (tx) => {
        const post = await tx.post
          .findUniqueOrThrow({
            where: { id, deletedAt: null },
          })
          .catch(handleError);

        await tx.post
          .update({
            where: { id, deletedAt: null },
            data: {
              likeCount: post.likeCount - 1,
            },
          })
          .catch(handleError);

        await tx.postLike
          .delete({
            where: {
              postId_userId: {
                postId: id,
                userId: userId,
              },
            },
          })
          .catch(handleUnlikeError);
      });
    },
  };
}

export type PostRepo = ReturnType<typeof createPostRepo>;
