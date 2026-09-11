"use client"

import { ShieldCheck } from "lucide-react"

import StepButtons from "./StepButtons"

export default function ConsentStep({
  formData,
  setFormData,
  nextStep,
}: any) {
  const options = [
    {
      value: "I consent to participate",
      title: "I consent to participate",
      description:
        "I have read the information above and voluntarily agree to participate in this research study.",
    },
    {
      value: "I do not consent",
      title: "I do not consent",
      description:
        "I do not wish to participate in this research study.",
    },
  ]

  return (
    <section
      className="
        font-['Outfit',system-ui,sans-serif]
        text-slate-950
      "
    >
      {/* =====================================================
          HEADER
      ====================================================== */}
      <div
        className="
          border-b
          border-slate-100
          px-6
          pb-8
          pt-6
          sm:px-8
          sm:pb-9
          sm:pt-7
          lg:px-10
        "
      >
        <h1
          className="
            mt-4
            text-3xl
            font-light
            tracking-tight
            text-slate-950
            sm:text-4xl
          "
        >
          Consent to Participate
        </h1>

        <p
          className="
            mt-5
            max-w-[68ch]
            text-lg
            font-normal
            leading-relaxed
            text-slate-600
          "
        >
          You are being invited to participate in the AIDES-T2D research study.
          Before continuing, please review the information below and indicate
          whether you consent to participate in this study.
        </p>

        {/* =================================================
            PRE-SURVEY CONTEXT
        ================================================== */}
        <div
          className="
            mt-6
            flex
            max-w-[760px]
            items-center
            gap-5
            rounded-lg
            border-l-4
            border-l-blue-900
            px-5
            py-5
            shadow-lg
          "
        >
          {/* Pre-survey illustration */}
          <div
            className="
              flex
              h-[76px]
              w-[76px]
              shrink-0
              items-center
              justify-center
              sm:h-[84px]
              sm:w-[84px]
            "
          >
            <img
              src="/pre-survey/presurvey1.png"
              alt=""
              aria-hidden="true"
              className="
                h-full
                w-full
                object-contain
              "
            />
          </div>

          <p
            className="
              max-w-[70ch]
              text-base
              font-normal
              leading-relaxed
              text-slate-600
            "
          >
            This pre-survey is completed only once at the beginning of the
            study. Your responses will help personalize your experience
            throughout the AIDES-T2D program and support ongoing research
            focused on diabetes-related distress and well-being.
          </p>
     
        </div>
      </div>

      {/* =====================================================
          BODY
      ====================================================== */}
      <div
        className="
          space-y-10
          px-6
          py-9
          sm:px-8
          sm:py-10
          lg:px-10
        "
      >
        {/* =================================================
            IMPORTANT INFORMATION
        ================================================== */}
        <div
          className="
            mt-6
            flex
            max-w-[760px]
            gap-4
            rounded-lg
            border-l-4
            border-l-blue-900
            px-5
            py-5
            shadow-lg
          "
        >
          <div className="flex items-start gap-4">
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#EAF3FF]
                text-[#1473E6]
              "
            >
              <ShieldCheck
                aria-hidden="true"
                size={19}
                strokeWidth={1.7}
              />
            </div>

            <div className="min-w-0">
              <h2
                className="
                  text-base
                  font-medium
                  text-[#173B7A]
                "
              >
                Important information
              </h2>

              <ul
                className="
                  mt-4
                  space-y-3
                  text-md
                  font-normal
                  leading-relaxed
                  text-slate-600
                "
              >
                <li className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="
                      mt-[9px]
                      h-1.5
                      w-1.5
                      shrink-0
                      rounded-full
                      bg-[#1473E6]
                    "
                  />

                  <span>
                    Your participation in this study is completely voluntary.
                  </span>
                </li>

                <li className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="
                      mt-[9px]
                      h-1.5
                      w-1.5
                      shrink-0
                      rounded-full
                      bg-[#1473E6]
                    "
                  />

                  <span>
                    You may stop participating at any time without penalty.
                  </span>
                </li>

                <li className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="
                      mt-[9px]
                      h-1.5
                      w-1.5
                      shrink-0
                      rounded-full
                      bg-[#1473E6]
                    "
                  />

                  <span>
                    Your responses will be kept confidential and used only for
                    research purposes.
                  </span>
                </li>

                <li className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="
                      mt-[9px]
                      h-1.5
                      w-1.5
                      shrink-0
                      rounded-full
                      bg-[#1473E6]
                    "
                  />

                  <span>
                    Some survey questions may ask about your emotional
                    well-being and experiences managing diabetes.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* =================================================
            PARTICIPANT CONSENT
        ================================================== */}
        <div className="max-w-[820px]">
          <div className="mb-5">
            <h2
              className="
                text-2xl
                font-light
                tracking-tight
                text-slate-950
              "
            >
              Participant consent
            </h2>

            <p
              className="
                mt-2
                text-sm
                font-normal
                leading-relaxed
                text-slate-500
              "
            >
              Please select one of the options below.
            </p>
          </div>

          <div className="space-y-3">
            {options.map((option) => {
              const selected =
                formData.consent_status === option.value

              return (
                <label
                  key={option.value}
                  className={`
                    group
                    relative
                    block
                    cursor-pointer
                    rounded-[14px]
                    border
                    px-5
                    py-5
                    transition-all
                    duration-200
                    ${
                      selected
                        ? `
                          border-blue-900
                          bg-white
                          shadow-[0_8px_24px_rgba(20,115,230,0.08)]
                        `
                        : `
                          border-slate-200
                          bg-white
                          hover:border-blue-900
                          hover:bg-white
                        `
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* Custom radio */}
                    <span
                      aria-hidden="true"
                      className={`
                        mt-0.5
                        flex
                        h-5
                        w-5
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        border
                        transition-all
                        duration-200
                        ${
                          selected
                            ? "border-[#1473E6] bg-[#1473E6]"
                            : "border-slate-300 bg-white"
                        }
                      `}
                    >
                      {selected ? (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      ) : null}
                    </span>

                    {/* Native radio */}
                    <input
                      type="radio"
                      name="consent_status"
                      value={option.value}
                      checked={selected}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consent_status: e.target.value,
                        })
                      }
                      className="sr-only"
                    />

                    {/* Copy */}
                    <div className="min-w-0">
                      <p
                        className={`
                          text-[15px]
                          font-medium
                          leading-snug
                          transition-colors
                          duration-200
                          ${
                            selected
                              ? "text-[#173B7A]"
                              : "text-slate-900"
                          }
                        `}
                      >
                        {option.title}
                      </p>

                      <p
                        className="
                          mt-1.5
                          max-w-[68ch]
                          text-sm
                          font-normal
                          leading-relaxed
                          text-slate-500
                        "
                      >
                        {option.description}
                      </p>
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* =================================================
            ACKNOWLEDGEMENT
        ================================================== */}
        <div
          className="
            max-w-[820px]
            border-l-4
            border-[#173B7A]
            bg-white
            px-5
            py-4
            shadow-[0_8px_24px_rgba(15,45,80,0.06)]
          "
        >
          <p
            className="
              text-sm
              font-normal
              leading-relaxed
              text-slate-600
            "
          >
            By selecting{" "}
            <span className="font-medium text-slate-900">
              “I consent to participate”
            </span>
            , you acknowledge that you understand the purpose of this study and
            agree to participate voluntarily.
          </p>
        </div>
      </div>

      {/* =====================================================
          FOOTER BUTTONS
      ====================================================== */}
      <StepButtons nextStep={nextStep} />
    </section>
  )
}