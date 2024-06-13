import { z } from "zod";

import { Comment } from "@/models/comment";
import { RequestProps } from "@/utils/api/schema";

// #################################
// Create comment
// #################################
export const CreateCommentRequest = {
  body: z.object({
    content: z.string(),
    postId: z.string(),
    parentId: z.string().optional(),
  }),
  auth: z.object({
    userId: z.string(),
  }),
};

export type CreateCommentRequest = RequestProps<typeof CreateCommentRequest>;

// #################################
// List comments
// #################################
export const ListCommentsRequestQuery = z.object({
  limit: z.coerce.number().min(1).max(40),
  postId: z.string(),
  parentId: z.string().optional(),
  cursor: z.string().optional(),
});

export type ListCommentsRequestQuery = z.infer<typeof ListCommentsRequestQuery>;

export const ListCommentsRequest = {
  query: z
    .object({ nextKey: z.string() })
    .or(ListCommentsRequestQuery.omit({ cursor: true }))
    .openapi({ param: { name: "query" } }),
};

export type ListCommentsRequest = RequestProps<typeof ListCommentsRequest>;

export const ListCommentsResponse = z.object({
  items: Comment.array(),
  nextKey: z.string().nullable(),
});

export type ListCommentsResponse = z.infer<typeof ListCommentsResponse>;

// #################################
// Delete comment
// #################################
export const DeleteCommentRequest = {
  params: z.object({
    id: z.string(),
  }),
  auth: z.object({
    userId: z.string(),
  }),
};

export type DeleteCommentRequest = RequestProps<typeof DeleteCommentRequest>;
