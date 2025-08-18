import { headers } from "next/headers"
import { env } from "@/env"
import { type WebhookEvent } from "@clerk/nextjs/server"
import { Webhook } from "svix"

import { db } from "@/server/db"

export const runtime = "nodejs"
export const preferredRegion = ["sin1"]
export const maxDuration = 60

export async function POST(req: Request) {
  const CLERK_WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET!

  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    })
  }

  // Get the body
   
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(CLERK_WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return new Response("Error occured", {
      status: 400,
    })
  }

  if (evt) {
    // 👉 Parse the incoming event body into a ClerkWebhook object
    try {
      // 👉 `webhook.type` is a string value that describes what kind of event we need to handle
      switch (evt.type) {
        // 👉 If the type is "user.created" create a record in the users table
        case "user.created": {
          const primaryEmail = evt.data.email_addresses.find(
            (email) => email.id === evt.data.primary_email_address_id
          )?.email_address

          if (!primaryEmail) {
            throw new Error("Primary email not found")
          }
          await db.$transaction(async (tx) => {
            await tx.user.create({
              data: {
                id: evt.data.id,
                created_at: new Date(evt.data.created_at),
                updated_at: new Date(evt.data.updated_at),
                first_name: evt.data.first_name,
                last_name: evt.data.last_name,
                image_url: evt.data.image_url,
                primary_email: primaryEmail,
                ...(evt.data.username && { username: evt.data.username }),
              },
            })
          })

          break
        }
        // 👉 If the type is "user.updated" the important values in the database will be updated in the users table
        case "user.updated": {
          const primaryEmail = evt.data.email_addresses.find(
            (email) => email.id === evt.data.primary_email_address_id
          )?.email_address

          if (!primaryEmail) {
            throw new Error("Primary email not found")
          }

          await db.user.upsert({
            where: {
              id: evt.data.id,
            },
            create: {
              id: evt.data.id,
              created_at: new Date(evt.data.created_at),
              updated_at: new Date(evt.data.updated_at),
              first_name: evt.data.first_name,
              last_name: evt.data.last_name,
              image_url: evt.data.image_url,
              primary_email: primaryEmail,
              ...(evt.data.username && { username: evt.data.username }),
            },
            update: {
              updated_at: new Date(evt.data.updated_at),
              first_name: evt.data.first_name,
              last_name: evt.data.last_name,
              image_url: evt.data.image_url,
              primary_email: primaryEmail,
              ...(evt.data.username && { username: evt.data.username }),
            },
          })

          break
        }
        // 👉 If the type is "user.deleted", delete the user record and associated blocks
        case "user.deleted": {
          await db.user.delete({
            where: {
              id: evt.data.id,
            },
          })
          break
        }
      }
      return new Response("", { status: 201 })
    } catch (err) {
      console.error(err)
      return new Response("Error occurred -- processing webhook data", {
        status: 500,
      })
    }
  }

  return new Response("", { status: 200 })
}
