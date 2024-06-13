import { Post as RawPost } from "@prisma/pg/index";
import { z } from "zod";

import { Comment, formatComment } from "@/models/comment";
import { RawComment } from "@/repos/commentRepo";
import { registerModelToApiDocs } from "@/utils/api/openapi";

// #################################
// Post
// #################################
export const Post = registerModelToApiDocs(
  "Post",
  z.object({
    id: z.string().uuid(),
    title: z.string(),
    content: z.string(),
    likeCount: z.number(),
    comments: Comment.array().optional(),
    authorId: z.string(),
    createdAt: z.date(),
  }),
);

export type Post = z.infer<typeof Post>;

export function formatPost(raw: RawPost, comments?: RawComment[]): Post {
  return {
    id: raw.id,
    title: raw.title,
    content: raw.content,
    likeCount: raw.likeCount,
    authorId: raw.authorId,
    createdAt: raw.createdAt,
    comments: comments?.map((c) => formatComment(c)),
  };
}
