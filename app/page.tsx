import Form from '@/components/form'
import Notification from '../components/notification'
import { Card, CardContent } from '@/components/ui/card'
import { getAllBlogs } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

export default async function Home() {
  const blogs = await getAllBlogs()
  return (
    <>
    <Notification/>
    <section className='py-24'>
      <div className='container'>
        <Form />

        <div className='mt-44'>
          <h2 className='text-xl font-semibold leading-none tracking-tight'>
            Recent blogs
          </h2>
        </div>

        <div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2'>
          {blogs?.map(blog => (
            <Card key={blog.id} className='overflow-hidden'>
              <CardContent className='p-0'>
                <Link href={`/blog/${blog.id}`} key={blog.id}>
                  <Image
                    alt=''
                    src={blog.imageUrl}
                    width={1792}
                    height={1024}
                    className='w-full'
                  />

                  <div className='px-4 pb-3 pt-2 '>
                    <h3 className='font-medium'>{blog.title}</h3>
                    <p className='text-xs text-gray-600'>
                      {formatDate(blog.created_at)}
                    </p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
    </>
  )
}
