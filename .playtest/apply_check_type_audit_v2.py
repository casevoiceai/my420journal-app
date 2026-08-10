from pathlib import Path
import re

source_path = Path('.playtest/apply_check_type_audit.py')
source = source_path.read_text()

pattern = re.compile(
    r"chapter_three = replace_once\(\n    chapter_three,\n    \"    stat,\\n    dc: tier\.dc,\\n    statBonus,\",\n    \"    stat,\\n    checkType: inferChapterThreeFreeTextCheckType\(plan\.playerAction, stat\),\\n    dc: tier\.dc,\\n    statBonus,\",\n    'Chapter 3 free-text preview check type',\n\)\n",
)
replacement = '''chapter_three = replace_once(
    chapter_three,
    "  const manaCost = Number(synthetic.check.manaCost) || 0\\n  return Object.freeze({\\n    requiresRoll: true,\\n    stat: synthetic.check.stat,\\n    dc: tier.dc,",
    "  const manaCost = Number(synthetic.check.manaCost) || 0\\n  const checkType = inferChapterThreeFreeTextCheckType(plan.playerAction, synthetic.check.stat)\\n  return Object.freeze({\\n    requiresRoll: true,\\n    stat: synthetic.check.stat,\\n    checkType,\\n    dc: tier.dc,",
    'Chapter 3 free-text preview check type',
)
chapter_three = replace_once(
    chapter_three,
    "  const preview = {\\n    requiresRoll: true,\\n    stat,\\n    dc: tier.dc,",
    "  const preview = {\\n    requiresRoll: true,\\n    stat,\\n    checkType: inferChapterThreeFreeTextCheckType(plan.playerAction, stat),\\n    dc: tier.dc,",
    'Chapter 3 custom resolution preview check type',
)
'''
source, count = pattern.subn(lambda _: replacement, source, count=1)
if count != 1:
    raise SystemExit(f'Chapter 3 source patch replacement count was {count}')

old_event_patch = '''chapter_three = replace_once(
    chapter_three,
    "    stat: preview.stat,\\n    dc: preview.dc,",
    "    stat: preview.stat,\\n    checkType: preview.checkType,\\n    dc: preview.dc,",
    'Chapter 3 resolved event check type',
)
'''
new_event_patch = old_event_patch + '''chapter_three = replace_once(
    chapter_three,
    "    stat: preview.stat,\\n    dc: preview.dc,",
    "    stat: preview.stat,\\n    checkType: preview.checkType,\\n    dc: preview.dc,",
    'Chapter 3 custom resolved event check type',
)
'''
if old_event_patch not in source:
    raise SystemExit('Chapter 3 resolved event source patch missing')
source = source.replace(old_event_patch, new_event_patch, 1)

source = source.replace(
    "    'checkType: inferChapterThreeFreeTextCheckType(plan.playerAction, stat)',\n",
    "    'checkType: inferChapterThreeFreeTextCheckType(plan.playerAction, stat)',\n    'const checkType = inferChapterThreeFreeTextCheckType(plan.playerAction, synthetic.check.stat)',\n",
    1,
)

compiled = compile(source, str(source_path), 'exec')
exec(compiled, {'__name__': '__main__'})
