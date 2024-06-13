import { Comment as RawComment } from "@prisma/pg/index";
import { z } from "zod";

import { registerModelToApiDocs } from "@/utils/api/openapi";

// #################################
// Comment
// #################################
export const Comment = registerModelToApiDocs(
  "Comment",
  z.object({
    id: z.string().uuid(),
    content: z.string(),
    postId: z.string(),
    parentId: z.string().nullable(),
    authorId: z.string(),
    createdAt: z.date(),
  }),
);

export type Comment = z.infer<typeof Comment>;

export function formatComment(raw: RawComment): Comment {
  return {
    id: raw.id,
    content: raw.content,
    postId: raw.postId,
    parentId: raw.parentId,
    authorId: raw.authorId,
    createdAt: raw.createdAt,
  };
}
