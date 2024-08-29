import Link from 'next/link'
import { MoveLeft } from 'lucide-react'
export default function Checkout() {

  return (
    <section className='py-24'>
      <div className='container max-w-3xl'>
        <h1 className='text-sm font-medium text-emerald-600'>
          Payment successful
        </h1>
        <p className='mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl'>
          Thanks for joining.
        </p>
        <p className='mt-2 text-base text-gray-500 dark:text-gray-400'>
          We&apos;re super stoked to have you here!
        </p>

        <Link
          href='/'
          className='mt-8 flex w-fit gap-2 rounded-md bg-emerald-500 px-3 py-1 text-white no-underline hover:bg-emerald-600 hover:no-underline'
        >
          <MoveLeft className='h-6 w-6' />
          <span>Go back home</span>
        </Link>
      </div>
    </section>
  )
}
