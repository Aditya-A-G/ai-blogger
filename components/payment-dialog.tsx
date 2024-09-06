import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader
} from '@/components/ui/drawer'
import { Drawer as DrawerPrimitive } from 'vaul'
import Script from 'next/script'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { createRazorpayOrder, verifyPaymentSignature } from '@/app/actions'
import { toast } from 'sonner'
import { useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

type PlanId = 'BASIC' | 'PRO' | 'ENTERPRISE'

const tiers: {
  name: string
  id: PlanId
  price: number
  credits: number
  description: string
  features: string[]
  mostPopular: boolean
}[] = [
  {
    name: 'Basic',
    id: 'BASIC',
    price: 849,
    credits: 50,
    description: 'Create Amazing Blogs',
    features: ['50 credits', 'High Quality Images', 'Generate any Blog'],
    mostPopular: false
  },
  {
    name: 'Pro',
    id: 'PRO',
    price: 2512,
    credits: 200,
    description: 'Create Amazing Blogs',
    features: ['200 credits', 'High Quality Images', 'Generate any Blog'],
    mostPopular: true
  },
  {
    name: 'Enterprise',
    id: 'ENTERPRISE',
    price: 8400,
    credits: 750,
    description: 'Create Amazing Blogs',
    features: ['750 credits', 'High Quality Images', 'Generate any Blog'],
    mostPopular: false
  }
]

export default function PaymentDialog(
  props: React.ComponentProps<typeof DrawerPrimitive.Root>
) {
  const { session } = useClerk()
  const router = useRouter()

  async function handleCheckout(planId: PlanId) {
    if (props.onOpenChange) {
      props.onOpenChange(false)
    }
    try {
      const orderId = await createRazorpayOrder(planId)

      if (orderId === null) return

      const options = {
        key: process.env.RAZORPAY_KEY_ID,
        name: 'name',
        description: 'description',
        order_id: orderId,
        theme: { color: '#3399cc' },
        handler: async function (response: any) {
          const data = {
            orderCreationId: orderId,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          }

          const result = await verifyPaymentSignature(data)

          if (result.success) {
            toast.success('Payment succeed')
            router.push('/checkout')
          } else {
            toast.error('Payment failed')
          }
        }
      }

      const paymentObject = new window.Razorpay(options)
      paymentObject.on('payment.failed', function (response: any) {
        toast.error(response.error.description)
      })
      paymentObject.open()
    } catch (error) {
      console.log(error)
    }
  }
  return (
    <>
      {' '}
      <Script
        id='razorpay-checkout-js'
        src='https://checkout.razorpay.com/v1/checkout.js'
      />
      <Drawer {...props}>
        <DrawerContent className='h-[90%] lg:h-3/4'>
          <div className='mx-auto w-full max-w-full overflow-scroll'>
            <DrawerHeader className='flex justify-center text-4xl font-semibold'>
              Plans
            </DrawerHeader>
            <div className='isolate mt-5 grid grid-cols-1 gap-8 px-3 md:grid-cols-2 lg:grid-cols-3'>
              {tiers.map(tier => (
                <div
                  key={tier.id}
                  className={cn(
                    tier.mostPopular
                      ? 'ring-2 ring-emerald-600'
                      : 'ring-1 ring-gray-200',
                    'rounded-3xl p-8 xl:p-10'
                  )}
                >
                  <div className='flex items-center justify-between gap-x-4'>
                    <h3
                      id={tier.id}
                      className={cn(
                        tier.mostPopular ? 'text-emerald-600' : 'text-gray-900',
                        'text-lg font-semibold leading-8'
                      )}
                    >
                      {tier.name}
                    </h3>
                    {tier.mostPopular ? (
                      <p className='rounded-full bg-emerald-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-emerald-600'>
                        Most popular
                      </p>
                    ) : null}
                  </div>
                  <p className='mt-4 text-sm leading-6 text-gray-600'>
                    {tier.description}
                  </p>
                  <p className='mt-6 flex items-baseline gap-x-1'>
                    <span className='text-4xl font-bold tracking-tight text-gray-900'>
                      {tier.price} Rs
                    </span>
                    <span className='text-sm font-semibold leading-6 text-gray-600'>
                      / {tier.credits} Credits
                    </span>
                  </p>
                  <button
                    onClick={() => handleCheckout(tier.id)}
                    aria-describedby={tier.id}
                    className={cn(
                      tier.mostPopular
                        ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500'
                        : 'text-emerald-600 ring-1 ring-inset ring-emerald-200 hover:ring-emerald-300',
                      'mt-6 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600'
                    )}
                  >
                    Get started today
                  </button>
                  <ul
                    role='list'
                    className='mt-8 space-y-3 text-sm leading-6 text-gray-600 xl:mt-10'
                  >
                    {tier.features.map(feature => (
                      <li key={feature} className='flex gap-x-3'>
                        <Check
                          className='h-6 w-5 flex-none text-emerald-600'
                          aria-hidden='true'
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <DrawerFooter></DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
