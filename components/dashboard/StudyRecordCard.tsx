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
          text-[12px]
        "
      >
        <span className="font-medium text-[#0b2857]">
          Study Record
        </span>
  
        <span className="text-[#cbd5e1]">•</span>
  
        <span className="inline-flex items-center gap-1.5 text-[#52657d]">
          Pre-Survey
          <span className="text-[#16805f]">✓</span>
        </span>
  
        <span className="text-[#cbd5e1]">•</span>
  
        <span className="inline-flex items-center gap-1.5 text-[#52657d]">
          DDS-17
          <span className="text-[#16805f]">✓</span>
        </span>
  
        <span className="text-[#cbd5e1]">•</span>
  
        <span className="inline-flex items-center gap-1.5 text-[#52657d]">
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
  
            <span className="inline-flex items-center gap-1.5 text-[#52657d]">
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