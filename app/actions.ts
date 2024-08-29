'use server'

import OpenAI from 'openai'
import { decode } from 'base64-arraybuffer'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { clerkClient, currentUser } from '@clerk/nextjs/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10'
})

const openai = new OpenAI({ apiKey: process.env.OPEN_API_KEY })

export async function createCompletion(prompt: string) {
  if (!prompt) {
    return { error: 'Prompt is required.' }
  }

  const user = await currentUser()
  const userId = user?.id

  if (!userId) {
    return { error: 'User is not logged in' }
  }

  const credits = Number(user.publicMetadata?.credits || 0)

  if (!credits) {
    return { error: 'You have no credits left.', status: 402 }
  }

  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: {
      credits: credits - 1
    }
  })

  const messages: any = [
    {
      role: 'user',
      content: `Write a blog post around 200 words about the following topic: "${prompt}" in markdown format.`
    }
  ]

  const [completion, image] = await Promise.all([
    openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages
    }),
    openai.images.generate({
      model: 'dall-e-3',
      prompt: `Generate an image for a blog post about "${prompt}"`,
      n: 1,
      size: '1792x1024',
      response_format: 'b64_json'
    })
  ])

  const content = completion?.choices?.[0]?.message?.content

  if (!content) {
    return { error: 'Unable to generate the blog content.' }
  }

  const imageName = `blog-${Date.now()}`

  const imageData = image?.data?.[0].b64_json as string

  if (!imageData) {
    return { error: 'Unable to generate the blog image.' }
  }

  const { data, error } = await supabase.storage
    .from('ai-blog-images')
    .upload(imageName, decode(imageData), { contentType: 'image/png' })

  if (error) {
    return { error: 'Unable to upload the blog image to Storage.' }
  }

  const path = data?.path

  const imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/ai-blog-images/${path}`

  const { data: blog, error: blogError } = await supabase
    .from('blogs')
    .insert([{ title: prompt, content, imageUrl, userId }])
    .select()

  if (blogError) {
    return { error: 'Unable to insert the blog into the database.' }
  }

  const blogId = blog?.[0]?.id
  revalidatePath('/')
  redirect(`/blog/${blogId}`)
}

type LineItem = Stripe.Checkout.SessionCreateParams.LineItem

export async function createStripeCheckoutSession(lineItems: LineItem[]) {
  const user = await currentUser()
  if (!user) {
    return { sessionId: null, checkoutError: 'You need to sign in first.' }
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL as string

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    success_url: `${origin}/checkout?sessionId={CHECKOUT_SESSION_ID}`,
    cancel_url: origin,
    customer_email: user.emailAddresses[0].emailAddress
  })

  return { sessionId: session.id, checkoutError: null }
}

export async function retrieveStripeCheckoutSession(sessionId: string) {
  if (!sessionId) {
    return { success: false, error: 'No session ID provided.' }
  }

  const user = await currentUser()
  if (!user) {
    return { success: false, error: 'You need to sign in first.' }
  }

  const previousCheckoutSessionIds = Array.isArray(
    user.publicMetadata.checkoutSessionIds
  )
    ? user.publicMetadata.checkoutSessionIds
    : []

  if (previousCheckoutSessionIds.includes(sessionId)) {
    return {
      success: true,
      error: null
    }
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId)

  await clerkClient.users.updateUserMetadata(user.id, {
    publicMetadata: {
      credits: 20,
      checkoutSessionIds: [...previousCheckoutSessionIds, sessionId],
      stripeCustomerId: session.customer,
      stripePaymentId:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id
    }
  })

  return { success: true, error: null }
}
