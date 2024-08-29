'use server'

import OpenAI from 'openai'
import { decode } from 'base64-arraybuffer'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { clerkClient, currentUser } from '@clerk/nextjs/server'
import Razorpay from 'razorpay'
import crypto from 'crypto'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET
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

  let response = completion?.choices?.[0]?.message?.content
  if (!response) {
    return { error: 'Unable to generate the blog content.' }
  }

  response = response.replace(/^`+|`+$/g, '')

  const content = response.replace(/^markdown\s*/i, '')
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

enum Plans {
  BASIC = 10,
  PRO = 30,
  ENTERPRISE = 100
}

const planCredits = {
  [Plans.BASIC]: 50,
  [Plans.PRO]: 200,
  [Plans.ENTERPRISE]: 750
}

export async function createRazorpayOrder(plan: keyof typeof Plans) {
  const amount = Plans[plan] * 100
  const options = {
    amount,
    currency: 'USD'
  }
  try {
    const order = await razorpay.orders.create(options)
    return order.id
  } catch (error) {
    console.error('Error creating Razorpay order: ', error)
    return null
  }
}

const generateSignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string
) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    throw new Error('Razorpay key secret is not defined in env variables.')
  }

  const sig = crypto
    .createHmac('sha256', keySecret)
    .update(razorpayOrderId + '|' + razorpayPaymentId)
    .digest('hex')
  return sig
}

export async function verifyPaymentSignature({
  orderCreationId,
  razorpayPaymentId,
  razorpaySignature
}: {
  orderCreationId: string
  razorpayPaymentId: string
  razorpaySignature: string
}) {
  const signature = generateSignature(orderCreationId, razorpayPaymentId)

  if (signature !== razorpaySignature) {
    return { success: false, error: 'Payment signature mismatch.' }
  }

  const user = await currentUser()

  if (!user) {
    return { success: false, error: 'You need to sign in first.' }
  }

  const payment = await razorpay.orders.fetch(orderCreationId)

  if (payment.status !== 'paid') {
    return {
      success: false,
      error: `Payment not succeeded. status- ${payment.status}`
    }
  }
  const amountPaid = payment.amount_paid / 100

  const creditsToAdd = Object.keys(Plans).find(
    plan => Plans[plan as keyof typeof Plans] * 100 === amountPaid * 100
  )

  if (!creditsToAdd) {
    return { success: false, error: 'Invalid payment amount.' }
  }
  const credits = planCredits[Plans[creditsToAdd as keyof typeof Plans]]

  await clerkClient.users.updateUserMetadata(user.id, {
    publicMetadata: {
      credits: Number(user.publicMetadata?.credits || 0) + credits
    }
  })

  return { success: true, error: null }
}
