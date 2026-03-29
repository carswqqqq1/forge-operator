export async function startConnectorAuth(authUrl: string, connectorKey: string) {
  const popup = window.open(
    authUrl,
    `forge-${connectorKey}-auth`,
    "popup=yes,width=640,height=760,menubar=no,toolbar=no,location=yes,status=no,resizable=yes,scrollbars=yes",
  )

  if (!popup) {
    window.location.href = authUrl
    return
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error(`Timed out while connecting ${connectorKey}.`))
    }, 120000)

    const poll = window.setInterval(() => {
      if (popup.closed) {
        cleanup()
        reject(new Error(`Authorization window was closed before ${connectorKey} finished connecting.`))
      }
    }, 500)

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== "forge:connector-auth") return
      if (event.data?.connector !== connectorKey) return

      cleanup()
      if (event.data?.status === "connected") resolve()
      else reject(new Error(event.data?.error || `Failed to connect ${connectorKey}.`))
    }

    const cleanup = () => {
      window.clearTimeout(timeout)
      window.clearInterval(poll)
      window.removeEventListener("message", onMessage)
    }

    window.addEventListener("message", onMessage)
  })
}
