"use client"
import { useEffect } from "react";

export default function Notification() {
    useEffect(() => {
        const script = document.createElement('script')
        script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
        script.defer = true
        script.onload = () => {
          window.OneSignalDeferred = window.OneSignalDeferred || []
          window.OneSignalDeferred.push((OneSignal: any) => {
            OneSignal.init({
              appId: '02b9c047-5eca-4d24-8e3a-13cfee1e4623',
            })
          })
        }
        document.head.appendChild(script)
      }, [])

      return <></>
}