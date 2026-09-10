type Props = {
    imageSrc: string
    imageAlt: string
    value: string
    label: string
    className?: string
  }
  
  export default function SummaryCard({
    imageSrc,
    imageAlt,
    value,
    label,
    className = "",
  }: Props) {
    return (
      <article
        className={`
          relative
          min-h-[145px]
          overflow-hidden
        
          px-6
          py-5
          font-[Univers,'Helvetica_Neue',Helvetica,Arial,sans-serif]
          ${className}
        `}
      >
        <div className="flex h-full min-h-[103px] items-center justify-between gap-5">
          {/* Text */}
          <div className="relative z-10 min-w-0">
            <p
              className="
                text-[31px]
                font-normal
                leading-none
                tracking-[-0.035em]
                text-[#082b68]
              "
            >
              {value}
            </p>
  
            <p
              className="
                mt-3
                text-[13px]
                font-normal
                leading-5
                text-black/60
              "
            >
              {label}
            </p>
          </div>
  
          {/* Illustration */}
          <div
            className="
              flex
              h-[105px]
              w-[105px]
              shrink-0
              items-center
              justify-center
            "
          >
            <img
              src={imageSrc}
              alt={imageAlt}
              width={105}
              height={105}
              className="
                block
                h-[100px]
                w-[100px]
                object-contain
              "
            />
          </div>
        </div>
      </article>
    )
  }