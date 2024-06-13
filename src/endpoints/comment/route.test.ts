import { randomUUID } from "crypto";
import { beforeEach, describe, it } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";

import { generateAccessToken } from "@/utils/api/auth";
import { APIServer, createServer } from "@/utils/api/createServer";
import { env } from "@/utils/env";

import { createCommentRoutes } from "./route";
import {
  CreateCommentRequest,
  DeleteCommentRequest,
  ListCommentsRequest,
} from "./schema";
import { CommentService } from "./service";

describe("CommentRoutes", () => {
  let server: APIServer;
  let service: MockProxy<CommentService>;
  let userId: string;
  let authorization: string;

  beforeEach(async () => {
    userId = randomUUID();
    authorization = `Bearer ${generateAccessToken(
      { userId },
      env.accessTokenSecret,
    )}`;
    server = createServer();
    service = mock<CommentService>();
    server.register(createCommentRoutes({ commentService: service }));
    await server.ready();
  });

  describe("POST /api/v1/comments", () => {
    let req: CreateCommentRequest;

    beforeEach(() => {
      req = {
        content: "content",
        postId: "postId",
        parentId: "parentId",
        userId,
      };
    });

    describe("normal case", () => {
      it("should call service", async ({ expect }) => {
        await server.inject({
          method: "post",
          url: "/api/v1/comments",
          body: {
            content: req.content,
            postId: req.postId,
            parentId: req.parentId,
          },
          headers: { authorization },
        });
        expect(service.createComment).toBeCalledWith(req);
      });
    });
  });

  describe("GET /api/v1/comments", () => {
    let req: ListCommentsRequest;
    const postId: string = randomUUID();

    describe("when given options", () => {
      beforeEach(() => {
        req = {
          limit: 3,
          postId,
        };
      });

      it("should call service", async ({ expect }) => {
        await server.inject({
          method: "get",
          url: "/api/v1/comments",
          query: { limit: "3", postId: `${postId}` },
        });
        expect(service.listComments).toBeCalledWith(req);
      });
    });

    describe("when given next key", () => {
      let nextKey: string;

      beforeEach(() => {
        nextKey = "some next key";
        req = { nextKey };
      });

      it("should call service", async ({ expect }) => {
        await server.inject({
          method: "get",
          url: "/api/v1/comments",
          query: { nextKey },
        });
        expect(service.listComments).toBeCalledWith(req);
      });
    });
  });

  describe("DELETE /api/v1/comments/:id", () => {
    let req: DeleteCommentRequest;

    beforeEach(() => {
      req = { id: randomUUID(), userId };
    });

    describe("normal case", () => {
      it("should call service", async ({ expect }) => {
        await server.inject({
          method: "delete",
          url: `/api/v1/comments/${req.id}`,
          headers: { authorization },
        });
        expect(service.deleteComment).toBeCalledWith(req);
      });
    });
  });
});
