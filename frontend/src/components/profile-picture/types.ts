export type CropPoint = {
  x: number
  y: number
}

export type CropArea = {
  width: number
  height: number
  x: number
  y: number
}

export type ProfilePicturePageProps = {
  token: string
  onComplete: () => void
}
