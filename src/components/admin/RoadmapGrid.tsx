'use client';

interface MonthCell {
  month: number;
  index: number;
  yearOffset: number;
  labels: {
    subject?: string;
    thinking?: string;
    gifted?: string;
    contest?: string;
    arithmetic?: string;
  };
}

interface RoadmapBlock {
  academicYear: number;
  gradeLabel: string; // 예) '초3'
  months: MonthCell[];
}

interface RoadmapGridProps {
  blocks: RoadmapBlock[];
  editableThinking?: boolean;
  thinkingTypeSelection?: Record<string, 'WMO' | 'GT' | 'GTA'>;
  thinkingLevelSelection?: Record<string, number>;
  onThinkingTypeToggle?: (key: string) => void;
  onThinkingLevelToggle?: (key: string) => void;
  visibleRows?: { subject: boolean; thinking: boolean; gifted: boolean; contest: boolean; arithmetic: boolean };
  subjectSelection?: Record<string, string>;
  onSubjectToggle?: (key: string) => void;
}

export default function RoadmapGrid({
  blocks,
  editableThinking = false,
  thinkingTypeSelection = {},
  thinkingLevelSelection = {},
  onThinkingTypeToggle,
  onThinkingLevelToggle,
  visibleRows = { subject: true, thinking: true, gifted: true, contest: true, arithmetic: true },
  subjectSelection = {},
  onSubjectToggle,
}: RoadmapGridProps) {
  const headerStyle = 'text-xs font-semibold text-muted uppercase tracking-wide';
  const cellStyle = 'border border-default text-center align-middle';
  const cellInnerStyle = 'h-12 flex items-center justify-center px-2 text-sm truncate';
  const rowTitleStyle = 'bg-muted/30 text-center align-middle';
  const rowTitleInnerStyle = 'h-12 flex items-center justify-center px-2 text-xs font-medium';
  const monthColWidth = 80; // px, 고정 폭으로 모든 월 칸 균일화

  const toGroupsOf3 = (arr: MonthCell[]) => {
    const groups: MonthCell[][] = [];
    for (let i = 0; i < arr.length; i += 3) {
      groups.push(arr.slice(i, i + 3));
    }
    return groups;
  };

  const buildThinkingRange = (cells: MonthCell[]) => {
    const nums = cells
      .map((c) => {
        const m = String(c.labels.thinking || '').match(/WMO\s*LV\.?\s*(\d+)/i);
        return m ? Number(m[1]) : undefined;
      })
      .filter((n): n is number => typeof n === 'number');
    if (nums.length === 0) return '';
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    if (min === max) return `WMO LV. ${min}`;
    return `WMO LV. ${min}~${max}`;
  };

  return (
    <div className="space-y-6">
      {blocks.map((block, bi) => (
        <div key={bi} className="bg-card rounded-lg shadow">
          <div className="px-4 py-3 border-b border-default flex items-center justify-between">
            <div className="text-base font-semibold text-title">
              {block.academicYear} ({block.gradeLabel})
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse table-fixed">
              <colgroup>
                <col style={{ width: 120 }} />
                {block.months.map((_, i) => (
                  <col key={i} style={{ width: monthColWidth }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th className={`${cellStyle} ${headerStyle} text-center`}>연월</th>
                  {block.months.map((m) => (
                    <th key={m.index} className={`${cellStyle} ${headerStyle}`}>{m.month}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.subject && (
                  <tr>
                    <td className={rowTitleStyle}><div className={rowTitleInnerStyle}>교과</div></td>
                    {toGroupsOf3(block.months).map((group, gi) => {
                      const defaultText = group[0]?.labels.subject || '';
                      const key = `${bi}-${gi}`;
                      const text = subjectSelection[key] || defaultText;
                      return (
                        <td key={`s-g${gi}`} className={cellStyle} colSpan={group.length}>
                          <div className="h-12 flex items-center justify-center px-2">
                            {onSubjectToggle ? (
                              <button
                                type="button"
                                onClick={() => onSubjectToggle && onSubjectToggle(key)}
                                className="px-2 py-1 text-xs rounded border border-default hover:bg-hover"
                                title="교과 진도 전환 (초3-1 → 초3-2 → ...)"
                              >
                                {text}
                              </button>
                            ) : (
                              <span className="text-sm truncate">{text}</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                )}
                {visibleRows.thinking && (
                  <tr>
                    <td className={rowTitleStyle}><div className={rowTitleInnerStyle}>사고력</div></td>
                    {toGroupsOf3(block.months).map((group, gi) => {
                      const label = group[0]?.labels.thinking || '';
                      const allSame = group.every((g) => (g.labels.thinking || '') === label);
                      const fallbackText = allSame ? label : buildThinkingRange(group);
                      const key = `${bi}-${gi}`;
                      const parsedType = (label.match(/^(WMO|GT|GTA)/i)?.[1]?.toUpperCase() as 'WMO' | 'GT' | 'GTA') || 'WMO';
                      const selectedType = thinkingTypeSelection[key] || parsedType;
                      const parsedLevel = Number((label.match(/LV\.?\s*(\d+)/i)?.[1] || '0'));
                      const selectedLevel = thinkingLevelSelection[key] || (parsedLevel > 0 ? parsedLevel : undefined);
                      const displayText = selectedLevel ? `${selectedType} LV. ${selectedLevel}` : fallbackText;
                      return (
                        <td key={`t-g${gi}`} className={cellStyle} colSpan={group.length}>
                          <div className="h-12 flex items-center justify-center gap-2 px-2">
                            {editableThinking ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onThinkingTypeToggle && onThinkingTypeToggle(key)}
                                  className="px-2 py-1 text-xs rounded border border-default hover:bg-hover"
                                  title="사고력 유형 전환 (WMO → GT → GTA)"
                                >
                                  {selectedType}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onThinkingLevelToggle && onThinkingLevelToggle(key)}
                                  className="px-2 py-1 text-xs rounded border border-default hover:bg-hover"
                                  title="레벨 증가 (1→20, 이후 다시 1)"
                                >
                                  {`LV. ${selectedLevel ?? parsedLevel || 1}`}
                                </button>
                              </>
                            ) : (
                              <span className="text-sm truncate">{displayText}</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                )}
                {visibleRows.gifted && (
                  <tr>
                    <td className={rowTitleStyle}><div className={rowTitleInnerStyle}>영재원</div></td>
                    {toGroupsOf3(block.months).map((group, gi) => {
                      const texts = group.map((m) => m.labels.gifted).filter(Boolean) as string[];
                      const text = texts.join(' / ');
                      return (
                        <td key={`g-g${gi}`} className={cellStyle} colSpan={group.length}>
                          <div className={cellInnerStyle}>{text}</div>
                        </td>
                      );
                    })}
                  </tr>
                )}
                {visibleRows.contest && (
                  <tr>
                    <td className={rowTitleStyle}><div className={rowTitleInnerStyle}>경시대회</div></td>
                    {toGroupsOf3(block.months).map((group, gi) => {
                      const texts = group.map((m) => m.labels.contest).filter(Boolean) as string[];
                      const text = texts.join(' / ');
                      return (
                        <td key={`c-g${gi}`} className={cellStyle} colSpan={group.length}>
                          <div className={cellInnerStyle}>{text}</div>
                        </td>
                      );
                    })}
                  </tr>
                )}
                {visibleRows.arithmetic && (
                  <tr>
                    <td className={rowTitleStyle}><div className={rowTitleInnerStyle}>연산</div></td>
                    {toGroupsOf3(block.months).map((group, gi) => {
                      const texts = group.map((m) => m.labels.arithmetic).filter(Boolean) as string[];
                      const text = texts.join(' / ');
                      return (
                        <td key={`a-g${gi}`} className={cellStyle} colSpan={group.length}>
                          <div className={cellInnerStyle}>{text}</div>
                        </td>
                      );
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}


