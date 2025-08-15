'use client';
import React, { ChangeEvent } from 'react';
import { useT, useLang } from 'src/locale';
import { useCourseStore } from '@features/course/store';
import { registry, allCoursePlugins, CourseTypeId } from '@features/course/plugins/registry';
import { Button } from '@components/components/ui/button';
import { Input } from '@components/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/components/ui/select';

interface Props {
  isVisible: boolean;
  onClose: () => void;
}

/**
 * 通用航线设置面板（底部抽屉）
 */
const SettingsSheet: React.FC<Props> = ({ isVisible, onClose }) => {
  const t = useT();
  const lang = useLang();
  const type = useCourseStore((s) => s.type);
  const params = useCourseStore((s) => s.params);
  const setType = useCourseStore((s) => s.setType);
  const setParams = useCourseStore((s) => s.setParams);

  const [draft, setDraft] = React.useState<Record<string, string>>({});

  // 初始化/同步 draft
  React.useEffect(() => {
    const obj: Record<string, string> = {};
    Object.entries(params).forEach(([k, v]) => {
      obj[k] = v != null ? String(v) : '';
    });
    setDraft(obj);
  }, [type, isVisible]);

  if (!isVisible) return null;

  const plugin = registry[type];

  // 移除自定义样式，使用UI组件的默认样式

  const onNumChange = (k: string) => (e: ChangeEvent<HTMLInputElement>) => {
    setDraft((d) => ({ ...d, [k]: e.target.value }));
  };

  const commitField = (k: string) => {
    const raw = draft[k];
    if (raw === '') return; // 空字符串不提交
    const num = Number(raw);
    if (!Number.isNaN(num)) setParams({ [k]: num });
  };

  const commitAllAndClose = () => {
    Object.entries(draft).forEach(([k, v]) => {
      const n = Number(v);
      if (!Number.isNaN(n)) setParams({ [k]: n });
    });
    onClose();
  };

  const wrapLabel = (
    label: string,
    value: string,
    onChange: (_e: ChangeEvent<HTMLInputElement>) => void,
    step?: number
  ) => (
    <label className="flex flex-col gap-2 text-sm">
      {label}
      <Input
        type="number"
        value={value}
        onChange={onChange}
        onBlur={() => commitField(label)}
        step={step}
      />
    </label>
  );

  return (
    <div
      className="absolute inset-0 bg-black/40 z-[2000]"
      onClick={onClose}
    >
      {/* 抽屉内容 */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto"
        onClick={(_e) => _e.stopPropagation()}
      >
        <div className="text-center text-lg font-bold text-foreground">{t('common.course_settings')}</div>

        {/* 航线类型切换 */}
        <label className="flex flex-col gap-1 text-sm text-foreground">
          {t('common.course_type')}
          <Select value={type} onValueChange={(value) => setType(value as CourseTypeId)}>
            <SelectTrigger>
              <SelectValue placeholder={t('common.select_course_type')} />
            </SelectTrigger>
            <SelectContent className="z-[9999]">
              {allCoursePlugins.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.i18n?.[lang]?.name ?? p.name ?? p.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        {/* 参数输入表单 */}
        {plugin.SettingsPanel ? (
          <plugin.SettingsPanel params={params} setParams={setParams} />
        ) : (
          Object.entries(plugin.paramSchema).map(([k, cfg]: any) =>
            React.cloneElement(
              wrapLabel(
                plugin.i18n?.[lang]?.labels[k] ?? cfg.label ?? k,
                draft[k] ?? String(params[k] ?? ''),
                onNumChange(k),
                cfg.step
              ),
              { key: k }
            )
          )
        )}

        <Button onClick={commitAllAndClose} variant="default">
          {t('common.close')}
        </Button>
      </div>
    </div>
  );
};

export default SettingsSheet; 