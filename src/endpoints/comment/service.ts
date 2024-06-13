import { formatComment } from "@/models/comment";
import { CommentRepo } from "@/repos/commentRepo";
import {
  decodeNextKey,
  encodeNextKey,
  hasNextKey,
} from "@/utils/api/pagination";
import { areErrorsEqual } from "@/utils/error/base";
import { RepoError } from "@/utils/error/repo";
import { ServiceError } from "@/utils/error/service";

import {
  CreateCommentRequest,
  DeleteCommentRequest,
  ListCommentsRequest,
  ListCommentsRequestQuery,
  ListCommentsResponse,
} from "./schema";

function handleError(err: unknown): never {
  if (areErrorsEqual(err, RepoError.NotFound)) {
    throw ServiceError.CommentNotFound;
  }
  if (areErrorsEqual(err, RepoError.PostNotFound)) {
    throw ServiceError.PostNotFound;
  }
  if (areErrorsEqual(err, RepoError.ParentCommentNotMatchWithPost)) {
    throw ServiceError.ParentCommentNotMatchWithPost;
  }
  if (areErrorsEqual(err, RepoError.CommentOnSubcomment)) {
    throw ServiceError.CommentOnSubcomment;
  }
  if (areErrorsEqual(err, RepoError.NoPermission)) {
    throw ServiceError.NoPermission;
  }
  throw err;
}

export const createCommentService = ({
  commentRepo,
}: {
  commentRepo: CommentRepo;
}) => {
  return {
    createComment: async (req: CreateCommentRequest): Promise<void> => {
      await commentRepo.create(req).catch(handleError);
    },

    listComments: async (
      req: ListCommentsRequest,
    ): Promise<ListCommentsResponse> => {
      const options = hasNextKey(req)
        ? decodeNextKey(req.nextKey, ListCommentsRequestQuery)
        : req;

      const comments = await commentRepo.list(options).catch(handleError);

      const cursor =
        comments.length === options.limit
          ? comments[comments.length - 1].id
          : null;

      return {
        items: comments.map(formatComment),
        nextKey: cursor ? encodeNextKey({ ...options, cursor }) : null,
      };
    },

    deleteComment: async (req: DeleteCommentRequest): Promise<void> => {
      await commentRepo.delete(req.id, req.userId).catch(handleError);
    },
  };
};

export type CommentService = ReturnType<typeof createCommentService>;
