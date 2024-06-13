import { z } from "zod";

import { Post } from "@/models/post";
import { ListPostsOrderBy } from "@/repos/postRepo";
import { RequestProps } from "@/utils/api/schema";

// #################################
// Get post
// #################################
export const GetPostRequest = {
  params: z.object({
    id: z.string(),
  }),
  query: z.object({
    withComments: z.coerce.boolean().optional(),
  }),
};

export type GetPostRequest = RequestProps<typeof GetPostRequest>;

// #################################
// Create post
// #################################
export const CreatePostRequest = {
  body: z.object({
    title: z.string(),
    content: z.string(),
  }),
  auth: z.object({
    userId: z.string(),
  }),
};

export type CreatePostRequest = RequestProps<typeof CreatePostRequest>;

// #################################
// List posts
// #################################
export const ListPostsRequestQuery = z.object({
  limit: z.coerce.number().min(1).max(40),
  orderBy: z.nativeEnum(ListPostsOrderBy),
  authorId: z.string().optional(),
  cursor: z.string().optional(),
});

export type ListPostsRequestQuery = z.infer<typeof ListPostsRequestQuery>;

export const ListPostsRequest = {
  query: z
    .object({ nextKey: z.string() })
    .or(ListPostsRequestQuery.omit({ cursor: true }))
    .openapi({ param: { name: "query" } }),
};

export type ListPostsRequest = RequestProps<typeof ListPostsRequest>;

export const ListPostsResponse = z.object({
  items: Post.array(),
  nextKey: z.string().nullable(),
});

export type ListPostsResponse = z.infer<typeof ListPostsResponse>;

// #################################
// Delete post
// #################################
export const DeletePostRequest = {
  params: z.object({
    id: z.string(),
  }),
  auth: z.object({
    userId: z.string(),
  }),
};

export type DeletePostRequest = RequestProps<typeof DeletePostRequest>;

// #################################
// Like post
// #################################
export const LikePostRequest = {
  params: z.object({
    id: z.string(),
  }),
  auth: z.object({
    userId: z.string(),
  }),
};

export type LikePostRequest = RequestProps<typeof LikePostRequest>;

// #################################
// Unlike post
// #################################
export const UnlikePostRequest = {
  params: z.object({
    id: z.string(),
  }),
  auth: z.object({
    userId: z.string(),
  }),
};

export type UnlikePostRequest = RequestProps<typeof UnlikePostRequest>;
