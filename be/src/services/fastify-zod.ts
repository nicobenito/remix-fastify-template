import type { FastifySerializerCompiler } from 'fastify/types/schema';
import { ResponseValidationError } from 'fastify-type-provider-zod';
import type { ZodAny } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasOwnProperty<T, K extends PropertyKey>(obj: T, prop: K): obj is T & Record<K, any> {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function resolveSchema(maybeSchema: ZodAny | { properties: ZodAny }): Pick<ZodAny, 'safeParse'> {
  if (hasOwnProperty(maybeSchema, 'safeParse')) {
    return maybeSchema;
  }

  if (hasOwnProperty(maybeSchema, 'properties')) {
    return maybeSchema.properties;
  }

  throw new Error(`Invalid schema passed: ${JSON.stringify(maybeSchema)}`);
}

export const serializerCompiler: FastifySerializerCompiler<ZodAny | { properties: ZodAny }> =
  ({ schema: maybeSchema }) =>
  (data) => {
    const schema: Pick<ZodAny, 'safeParse'> = resolveSchema(maybeSchema);

    const result = schema.safeParse(data);
    if (result.success) {
      return JSON.stringify(result.data, (key, value) => {
        if (typeof value === 'bigint') {
          try {
            // We have BigInt numbers in our API (most of them coming from the database), but they are not that big (at least for now :p).
            // This could be a problem in the future, but for now it's fine to just convert them to numbers
            return Number(value);
          } catch {
            return value.toString();
          }
        }

        return value;
      });
    }

    throw new ResponseValidationError(result);
  };
