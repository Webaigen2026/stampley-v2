import {
    CalendarCheck2,
    CheckCircle2,
    ClipboardCheck,
  } from "lucide-react"
  
  import RecordRow from "./RecordRow"
  
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
      <section className="rounded-[18px] border border-[#dfe8f3] bg-white p-6 md:p-8">
        <h2 className="text-[18px] font-medium text-[#0b2857]">
          Study Record
        </h2>
  
        <p className="mt-1 text-[12px] text-[#8391a3]">
          Your completed study milestones
        </p>
  
        <div className="mt-5 divide-y divide-[#e8eef5]">
          <RecordRow
            icon={<CheckCircle2 size={18} />}
            title="Pre-Survey"
            status="Completed"
          />
  
          <RecordRow
            icon={<ClipboardCheck size={18} />}
            title="DDS-17"
            status="Completed"
          />
  
          <RecordRow
            icon={<CalendarCheck2 size={18} />}
            title="Daily Check-In"
            status={
              checkedInToday
                ? "Completed today"
                : "Pending today"
            }
          />
  
          {studyComplete && (
            <RecordRow
              icon={<CheckCircle2 size={18} />}
              title="Post-Study Survey"
              status={
                postSurveyCompleted
                  ? "Completed"
                  : "Pending"
              }
            />
          )}
        </div>
      </section>
    )
  }