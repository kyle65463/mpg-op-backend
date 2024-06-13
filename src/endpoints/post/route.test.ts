import { randomUUID } from "crypto";
import { beforeEach, describe, it } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";

import { ListPostsOrderBy } from "@/repos/postRepo";
import { generateAccessToken } from "@/utils/api/auth";
import { APIServer, createServer } from "@/utils/api/createServer";
import { env } from "@/utils/env";

import { createPostRoutes } from "./route";
import {
  CreatePostRequest,
  DeletePostRequest,
  GetPostRequest,
  LikePostRequest,
  ListPostsRequest,
  UnlikePostRequest,
} from "./schema";
import { PostService } from "./service";

describe("PostRoutes", () => {
  let server: APIServer;
  let service: MockProxy<PostService>;
  let userId: string;
  let authorization: string;

  beforeEach(async () => {
    userId = randomUUID();
    authorization = `Bearer ${generateAccessToken(
      { userId },
      env.accessTokenSecret,
    )}`;
    server = createServer();
    service = mock<PostService>();
    server.register(createPostRoutes({ postService: service }));
    await server.ready();
  });

  describe("GET /api/v1/posts/:id", () => {
    let req: GetPostRequest;

    beforeEach(() => {
      req = { id: randomUUID() };
    });

    describe("normal case", () => {
      it("should call service", async ({ expect }) => {
        await server.inject({
          method: "get",
          url: `/api/v1/posts/${req.id}`,
          headers: { authorization },
        });
        expect(service.getPost).toBeCalledWith(req);
      });
    });
  });

  describe("POST /api/v1/posts", () => {
    let req: CreatePostRequest;

    beforeEach(() => {
      req = {
        title: "title",
        content: "content",
        userId,
      };
    });

    describe("normal case", () => {
      it("should call service", async ({ expect }) => {
        await server.inject({
          method: "post",
          url: "/api/v1/posts",
          body: { title: req.title, content: req.content },
          headers: { authorization },
        });
        expect(service.createPost).toBeCalledWith(req);
      });
    });
  });

  describe("GET /api/v1/posts", () => {
    let req: ListPostsRequest;

    describe("when given options", () => {
      beforeEach(() => {
        req = {
          limit: 3,
          orderBy: ListPostsOrderBy.CreatedAtDesc,
        };
      });

      it("should call service", async ({ expect }) => {
        await server.inject({
          method: "get",
          url: "/api/v1/posts",
          query: { limit: "3", orderBy: ListPostsOrderBy.CreatedAtDesc },
        });
        expect(service.listPosts).toBeCalledWith(req);
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
          url: "/api/v1/posts",
          query: { nextKey },
        });
        expect(service.listPosts).toBeCalledWith(req);
      });
    });
  });

  describe("DELETE /api/v1/posts/:id", () => {
    let req: DeletePostRequest;

    beforeEach(() => {
      req = { id: randomUUID(), userId };
    });

    describe("normal case", () => {
      it("should call service", async ({ expect }) => {
        await server.inject({
          method: "delete",
          url: `/api/v1/posts/${req.id}`,
          headers: { authorization },
        });
        expect(service.deletePost).toBeCalledWith(req);
      });
    });
  });

  describe("PUT /api/v1/posts/like/:id", () => {
    let req: LikePostRequest;

    beforeEach(() => {
      req = { id: randomUUID(), userId };
    });

    describe("normal case", () => {
      it("should call service", async ({ expect }) => {
        await server.inject({
          method: "put",
          url: `/api/v1/posts/like/${req.id}`,
          headers: { authorization },
        });
        expect(service.likePost).toBeCalledWith(req);
      });
    });
  });

  describe("PUT /api/v1/posts/like/:id", () => {
    let req: UnlikePostRequest;

    beforeEach(() => {
      req = { id: randomUUID(), userId };
    });

    describe("normal case", () => {
      it("should call service", async ({ expect }) => {
        await server.inject({
          method: "delete",
          url: `/api/v1/posts/like/${req.id}`,
          headers: { authorization },
        });
        expect(service.unlikePost).toBeCalledWith(req);
      });
    });
  });
});
