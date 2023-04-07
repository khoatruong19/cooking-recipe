import { z } from "zod";
import _ from "lodash";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { Recipe } from "@prisma/client";
import { TRPCError } from "@trpc/server";

type RatingWithRatingsCount = Recipe & { ratings: { value: number }[] , _count: { ratings: number } }

const getAverageRating = (
  item: RatingWithRatingsCount
) => _.sumBy(item.ratings, "value") / item._count.ratings;

export const recipeRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    try {
      const recipes = await ctx.prisma.recipe.findMany({
        include: {
          ratings: {
            select: {
              value: true,
            },
          },
          _count: {
            select: {
              ratings: true,
            },
          },
        },
      });

      const recipesWithRatings = _.map(recipes, (item) => {
        const averageRating = getAverageRating(item)
        return { ...item, ratings: Math.round(averageRating * 2) / 2 };
      });
      return recipesWithRatings;
    } catch (error) {
      console.log(error);
      return [];
    }
  }),
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const data = await ctx.prisma.recipe.findFirst({
          where:{
            id: input.id
          },
          include: {
            ratings: {
              select: {
                value: true,
              },
            },
            _count: {
              select: {
                ratings: true,
              },
            },
          },
        });

        if (!data) return {};

        const averageRating = getAverageRating(data)
        
        const recipe = { ...data, ratings: Math.round(averageRating * 2) / 2 }
       
        return recipe;
      } catch (error) {
        console.log(error);
        return [];
      }
    }),
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        tags: z.string(),
        ingredients: z.string(),
        image: z.string(),
        intructions: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const recipe = await ctx.prisma.recipe.create({
        data: {
          authorId: "211273676",
          ...input,
        },
      });

      return recipe;
    }),
});
