type Props = {
    checkedInToday: boolean
    studyComplete: boolean
    postSurveyCompleted: boolean
  }
  
  export default function StudyRecordCard({
    checkedInToday,
    studyComplete,
    postSurveyCompleted,
  }: Props) {
    return (
      <div
        className="
          flex
          flex-wrap
          items-center
          gap-x-4
          gap-y-2
          py-2
          text-xs
        "
      >
        <span className="text-sm font-medium text-slate-950">
          Study Record
        </span>
  
        <span className="text-[#cbd5e1]">•</span>
  
        <span className="inline-flex items-center gap-1.5 text-xs font-normal text-slate-500">
          Pre-Survey
          <span className="text-[#16805f]">✓</span>
        </span>
  
        <span className="text-[#cbd5e1]">•</span>
  
        <span className="inline-flex items-center gap-1.5 text-xs font-normal text-slate-500">
          DDS-17
          <span className="text-[#16805f]">✓</span>
        </span>
  
        <span className="text-[#cbd5e1]">•</span>
  
        <span className="inline-flex items-center gap-1.5 text-xs font-normal text-slate-500">
          Today
          <span
            className={
              checkedInToday
                ? "text-[#16805f]"
                : "text-[#b27a20]"
            }
          >
            {checkedInToday ? "✓" : "Pending"}
          </span>
        </span>
  
        {studyComplete && (
          <>
            <span className="text-[#cbd5e1]">•</span>
  
            <span className="inline-flex items-center gap-1.5 text-xs font-normal text-slate-500">
              Post-Survey
              <span
                className={
                  postSurveyCompleted
                    ? "text-[#16805f]"
                    : "text-[#b27a20]"
                }
              >
                {postSurveyCompleted ? "✓" : "Pending"}
              </span>
            </span>
          </>
        )}
      </div>
    )
  }