/** @type {import('next').NextConfig} */
const nextConfig = {
    images:{
        remotePatterns:[
            {protocol: 'https',
        hostname: process.env.SUPABASE_HOSTNAME}
        ]
    }
}

module.exports = nextConfig
