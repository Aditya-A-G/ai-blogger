'use client'

import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createCompletion } from '@/app/actions'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { useFormStatus } from 'react-dom'
import { SignInButton, SignedIn, SignedOut, useUser } from '@clerk/nextjs'
import { Zap } from 'lucide-react'
import PaymentDialog from './payment-dialog'
import { useState } from 'react'

export default function Form() {
  const { isSignedIn, user } = useUser()
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)

  const credits = user?.publicMetadata?.credits

  async function action(formData: FormData) {
    const prompt = formData.get('prompt')
    if (!prompt) {
      toast.error('Prompt is required.')
      return
    }

    if (typeof credits !== 'number' || credits <= 0) {
      toast.error('You have no credits left.', {
        action: {
          label: 'Get more',
          onClick: () => setPaymentDialogOpen(true)
        }
      })
      return
    }

    const result = await createCompletion(prompt as string)

    if (result?.error) {
      if (result?.status === 402) {
        toast.error('You have no credits left.', {
          action: {
            label: 'Get more',
            onClick: () => setPaymentDialogOpen(true)
          }
        })
      }
      toast.error(result.error)
    }
  }

  return (
    <section className='mx-auto max-w-xl'>
      <Card className='border-0 shadow-none'>
        <CardHeader className='text-center'>
          <CardTitle>AI Blogger</CardTitle>
          <CardDescription>Generate a blog post about anything</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between'>
            {isSignedIn && (
              <div className='flex items-center gap-2'>
                <Zap className='h-5 w-5 text-emerald-500' />

                <span className='text-sm text-zinc-500'>Credits: </span>
                <span className='font-medium'>
                  {typeof credits === 'number' ? credits : 0}
                </span>
              </div>
            )}
            {isSignedIn && (
              <Button
                size='sm'
                variant='secondary'
                onClick={() => setPaymentDialogOpen(true)}
              >
                Get more credits
              </Button>
            )}
          </div>
          <form action={action} className='mt-3'>
            <Input
              name='prompt'
              placeholder='What should I write about?'
              className='rounded-lg'
            />
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
      />
    </section>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <>
      <SignedIn>
        <Button
          size='sm'
          type='submit'
          className={cn('mt-3 w-full rounded-lg', pending && 'animate-pulse')}
        >
          {pending ? 'Working on it...' : 'Submit'}
        </Button>
      </SignedIn>
      <SignedOut>
        <SignInButton mode='modal'>
          <Button
            size='sm'
            type='button'
            variant='secondary'
            className='mt-3 w-full rounded-lg'
          >
            Sign in to start
          </Button>
        </SignInButton>
      </SignedOut>
    </>
  )
}
