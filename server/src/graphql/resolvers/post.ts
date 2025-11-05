/**
 * post.ts
 * - CRUD resolvers for Post
 * - Enforces owner checks
 * - Supports pagination, filtering, text search
 */

import { Post, PostConnection, Role, type Resolvers } from '../../generated/graphql';
import { getDb } from '../../db/client';
import { Filter, ObjectId } from 'mongodb';
import { z } from 'zod';

const createPostSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

const updatePostSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  body: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const postResolvers: Resolvers = {
  Query: {
    async post(_, { id }, { user }) {
      try {
        const db = getDb();
        const post = await db
          .collection('posts')
          .findOne({ _id: new ObjectId(id), softDeleted: false });
        if (!post) {
          console.error('Post not found:', id);
          return null;
        }
        if (post.softDeleted && user?.role !== Role.Admin) {
          console.error('Post is soft deleted:', id);
          return null;
        }
        const { _id, ...postData } = post;
        return {
          id: _id.toHexString(),
          ...postData,
        } as Post;
      } catch (error) {
        console.error('Post query failed:', error);
        // throw new Error('Failed to fetch post');
        return null;
      }
    },

    async posts(_, { after, limit = 10, ownerId, tags, includeSoftDeleted = false, q }, { user }) {
      try {
        const db = getDb();
        const filter: any = {};

        if (ownerId) filter.ownerId = ownerId;
        if (!includeSoftDeleted) filter.softDeleted = false;
        if (tags && tags.length > 0) filter.tags = { $in: tags };
        if (q) filter.$text = { $search: q };

        const cursor = after ? { _id: { $gt: new ObjectId(after) } } : {};
        const query = db
          .collection('posts')
          .find({ ...filter, ...cursor })
          .sort({ _id: 1 })
          .limit(limit + 1);

        const docs = await query.toArray();
        const hasNextPage = docs.length > limit;
        const sliced = hasNextPage ? docs.slice(0, limit) : docs;

        const edges = sliced.map(p => ({
          cursor: p._id.toHexString(),
          node: {
            id: p._id.toHexString(),
            ...p,
          },
        }));

        const endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;
        return {
          edges,
          pageInfo: {
            endCursor,
            hasNextPage,
          },
        } as unknown as PostConnection;
      } catch (error) {
        console.error('Posts query failed:', error);
        // throw new Error('Failed to fetch posts');
        return {
          edges: [],
          pageInfo: {
            endCursor: null,
            hasNextPage: false,
          },
        } as unknown as PostConnection;
      }
    },
  },

  Mutation: {
    async createPost(_, { input }, { user }) {
      if (!user) {
        console.error('Unauthorized: User not found');
        throw new Error('Unauthorized');
      }
      const parse = createPostSchema.safeParse(input);
      if (!parse.success) {
        console.error('Create post validation failed:', parse.error.format());
        throw new Error('Invalid input');
      }
      const db = getDb();
      const now = new Date().toISOString();
      const post = {
        ...parse.data,
        ownerId: user.id,
        createdAt: now,
        updatedAt: now,
        softDeleted: false,
      };

      const result = await db.collection('posts').insertOne(post);
      if (!result.insertedId) {
        console.error('Insert returned no insertedId:', result);
        throw new Error('Failed to create post');
      }
      const postId = result.insertedId.toHexString();
      return {
        id: postId,
        ...post,
      } as Post;
    },

    async updatePost(_, { input }, { user }) {
      if (!user) {
        console.error('Unauthorized: User not found');
        throw new Error('Unauthorized');
      }
      const parse = updatePostSchema.safeParse(input);
      if (!parse.success) {
        console.error('Update post validation failed:', parse.error.format());
        throw new Error('Invalid input');
      }
      const db = getDb();
      const post = await db.collection('posts').findOne({ _id: new ObjectId(input.id) });
      if (!post) {
        console.error('Post not found:', input.id);
        throw new Error('Post not found');
      }
      if (post.ownerId !== user.id && user.role !== Role.Admin) {
        console.error('Unauthorized: User is not the owner of the post');
        throw new Error('Unauthorized');
      }
      const updatedPost = { ...input, updatedAt: new Date().toISOString() };
      delete (updatedPost as any).id;
      //   console.log('updatedPost', updatedPost);
      //   console.log('post', post);
      await db
        .collection('posts')
        .updateOne({ _id: new ObjectId(input.id) }, { $set: updatedPost });
      return {
        id: post._id.toHexString(),
        ...post,
        title: updatedPost.title,
        updatedAt: updatedPost.updatedAt,
      } as unknown as Post;
    },

    async softDeletePost(_, { id }, { user }) {
      if (!user) {
        console.error('Unauthorized: User not found');
        throw new Error('Unauthorized');
      }
      const db = getDb();
      const post = await db.collection('posts').findOne({ _id: new ObjectId(id) });
      if (!post) {
        console.error('Post not found:', id);
        throw new Error('Post not found');
      }
      if (post.ownerId !== user.id && user.role !== Role.Admin) {
        console.error('Unauthorized: User is not the owner of the post');
        throw new Error('Unauthorized');
      }
      await db
        .collection('posts')
        .updateOne({ _id: new ObjectId(id) }, { $set: { softDeleted: true } });
      return { id, ...post, softDeleted: true } as unknown as Post;
    },

    async restorePost(_, { id }, { user }) {
      if (!user) {
        console.error('Unauthorized: User not found');
        throw new Error('Unauthorized');
      }
      const db = getDb();
      const post = await db.collection('posts').findOne({ _id: new ObjectId(id) });
      if (!post) {
        console.error('Post not found:', id);
        throw new Error('Post not found');
      }
      if (post.ownerId !== user.id && user.role !== Role.Admin) {
        console.error('Unauthorized: User is not the owner of the post');
        throw new Error('Unauthorized');
      }
      await db
        .collection('posts')
        .updateOne({ _id: new ObjectId(id) }, { $set: { softDeleted: false } });
      return { id, ...post, softDeleted: false } as unknown as Post;
    },
  },
};
