'use client';
import React, { ChangeEvent } from 'react';
import { useT, useLang } from 'src/locale';
import { useCourseStore } from '@features/course/store';
import { registry, allCoursePlugins, CourseTypeId } from '@features/course/plugins/registry';

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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 12,
    fontSize: 16,
    border: '1px solid #ccc',
    borderRadius: 8,
  };

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
    onChange: (e: ChangeEvent<HTMLInputElement>) => void,
    step?: number
  ) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
      {label}
      <input
        type="number"
        value={value}
        onChange={onChange}
        onBlur={() => commitField(label)}
        step={step}
        style={inputStyle}
      />
    </label>
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      {/* 抽屉内容 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxHeight: '75vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}>{t('common.course_settings')}</div>

        {/* 航线类型切换 */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
          {t('common.course_type')}
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CourseTypeId)}
            style={{ ...inputStyle, padding: 10 }}
          >
            {allCoursePlugins.map((p) => (
              <option key={p.id} value={p.id}>
                {p.i18n?.[lang]?.name ?? p.name ?? p.id}
              </option>
            ))}
          </select>
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

        <button
          onClick={commitAllAndClose}
          style={{
            marginTop: 12,
            padding: 12,
            background: '#ff7f0e',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
          }}
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  );
};

export default SettingsSheet; 