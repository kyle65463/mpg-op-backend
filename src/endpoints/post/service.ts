import { formatPost, Post } from "@/models/post";
import { CommentRepo, RawComment } from "@/repos/commentRepo";
import { PostRepo } from "@/repos/postRepo";
import {
  decodeNextKey,
  encodeNextKey,
  hasNextKey,
} from "@/utils/api/pagination";
import { areErrorsEqual } from "@/utils/error/base";
import { RepoError } from "@/utils/error/repo";
import { ServiceError } from "@/utils/error/service";

import {
  CreatePostRequest,
  DeletePostRequest,
  GetPostRequest,
  LikePostRequest,
  ListPostsRequest,
  ListPostsRequestQuery,
  ListPostsResponse,
  UnlikePostRequest,
} from "./schema";

function handleError(err: unknown): never {
  if (areErrorsEqual(err, RepoError.NotFound)) {
    throw ServiceError.PostNotFound;
  }
  throw err;
}

function handleDeleteError(err: unknown): never {
  if (areErrorsEqual(err, RepoError.NotFound)) {
    throw ServiceError.PostNotFound;
  }
  if (areErrorsEqual(err, RepoError.NoPermission)) {
    throw ServiceError.NoPermission;
  }
  throw err;
}

function handleLikeError(err: unknown): never {
  if (areErrorsEqual(err, RepoError.NotFound)) {
    throw ServiceError.PostNotFound;
  }
  if (areErrorsEqual(err, RepoError.Duplicated)) {
    throw ServiceError.PostAlreadyLiked;
  }
  if (areErrorsEqual(err, RepoError.PostNotLiked)) {
    throw ServiceError.PostNotLiked;
  }
  throw err;
}

// #################################
// Service
// #################################
export const createPostService = ({
  postRepo,
  commentRepo,
}: {
  postRepo: PostRepo;
  commentRepo: CommentRepo;
}) => {
  return {
    getPost: async (req: GetPostRequest): Promise<Post> => {
      const post = await postRepo.get(req.id).catch(handleError);

      let comments: RawComment[] | undefined;
      if (req.withComments) {
        comments = await commentRepo.list({ postId: post.id });
      }

      return formatPost(post, comments);
    },

    createPost: async (data: CreatePostRequest): Promise<void> => {
      await postRepo.create(data);
    },

    listPosts: async (req: ListPostsRequest): Promise<ListPostsResponse> => {
      const options = hasNextKey(req)
        ? decodeNextKey(req.nextKey, ListPostsRequestQuery)
        : req;

      const posts = await postRepo.list({
        ...options,
      });
      const cursor =
        posts.length === options.limit ? posts[posts.length - 1].id : null;

      return {
        items: posts.map((post) => formatPost(post)),
        nextKey: cursor ? encodeNextKey({ ...options, cursor }) : null,
      };
    },

    deletePost: async (req: DeletePostRequest): Promise<void> => {
      await postRepo.delete(req.id, req.userId).catch(handleDeleteError);
    },

    likePost: async (req: LikePostRequest): Promise<void> => {
      await postRepo.like(req.id, req.userId).catch(handleLikeError);
    },

    unlikePost: async (req: UnlikePostRequest): Promise<void> => {
      await postRepo.unlike(req.id, req.userId).catch(handleLikeError);
    },
  };
};

export type PostService = ReturnType<typeof createPostService>;
