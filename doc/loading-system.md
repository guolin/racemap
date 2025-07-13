# Loading System

## 概述

本项目的loading系统采用两种组件：

1. **SimpleLoading** - 简单loading，适用于所有页面
2. ~~LoadingScreen~~ - ~~功能丰富的loading，适用于复杂页面~~ (已移除)

## 使用方式

### SimpleLoading

适用于所有页面的简单loading组件。

```tsx
import SimpleLoading from '../components/SimpleLoading';

export default function MyPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {isLoading && <SimpleLoading />}
      <MyContent />
    </>
  );
}
```

### SimpleLoading Props

- `duration?: number` - loading持续时间（毫秒），默认800ms
- `onLoadingComplete?: () => void` - loading完成时的回调函数

## 最佳实践

1. **所有页面使用SimpleLoading** - 统一的简单loading体验
2. **固定显示时间** - 使用简单的定时器，避免复杂的依赖项处理
3. **避免复杂逻辑** - 不依赖地图加载状态等复杂条件

## 文件结构

- `components/SimpleLoading.tsx` - 简单loading样式 