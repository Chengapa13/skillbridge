export function scoreSkills(requirements, owned) {
  if (!requirements.length) return null;
  const weights = {critical:3,required:2,preferred:1};
  let matched=0,total=0;
  for (const r of requirements) { const w=weights[r.importance]; total+=w; if ((owned.get(r.skill_id)||0)>=r.min_level) matched+=w; }
  return Math.round(100*matched/total);
}
export function canTransition(from,to) {
  return ({applied:['shortlisted','rejected','withdrawn'],shortlisted:['selected','rejected','withdrawn'],selected:[],rejected:[],withdrawn:[]}[from]||[]).includes(to);
}
