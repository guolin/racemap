'use client';
import React, { ChangeEvent } from 'react';

interface Props {
  isVisible: boolean;
  courseAxis: string;
  courseSizeNm: string;
  startLineLenM: string;
  setCourseAxis: (v: string) => void;
  setCourseSizeNm: (v: string) => void;
  setStartLineLenM: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

/**
 * 管理员航线参数面板（底部抽屉）
 */
const SettingsSheet: React.FC<Props> = ({
  isVisible,
  courseAxis,
  courseSizeNm,
  startLineLenM,
  setCourseAxis,
  setCourseSizeNm,
  setStartLineLenM,
  onCancel,
  onSave,
}) => {
  if (!isVisible) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 12,
    fontSize: 16,
    border: '1px solid #ccc',
    borderRadius: 8,
  };

  const wrapLabel = (
    label: string,
    value: string,
    onChange: (e: ChangeEvent<HTMLInputElement>) => void,
    step?: string
  ) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
      {label}
      <input
        type="number"
        value={value}
        onChange={onChange}
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
      onClick={onCancel}
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
        <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}>航线设置</div>

        {wrapLabel('角度 (°M)', courseAxis, (e) => setCourseAxis(e.target.value))}
        {wrapLabel('距离 (NM)', courseSizeNm, (e) => setCourseSizeNm(e.target.value), '0.1')}
        {wrapLabel('起航线长度 (m)', startLineLenM, (e) => setStartLineLenM(e.target.value))}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: 12,
              background: '#eee',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
            }}
          >
            取消
          </button>
          <button
            onClick={onSave}
            style={{
              flex: 1,
              padding: 12,
              background: '#ff7f0e',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsSheet; 