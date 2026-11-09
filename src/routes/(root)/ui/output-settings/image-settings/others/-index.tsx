import { Divider } from '@heroui/react'

import Metadata from './Metadata'
import PreserveDates from './PreserveDates'

type OthersProps = {
  mediaIndex: number
}

function Others({ mediaIndex }: OthersProps) {
  return (
    <div>
      <Metadata mediaIndex={mediaIndex} />
      <Divider className="my-3" />
      <PreserveDates mediaIndex={mediaIndex} />
    </div>
  )
}

export default Others
