# Loading 系统说明

## 概述

为了提升用户体验，我们为应用添加了loading页面系统。系统包含两个主要的loading组件：

1. **SimpleLoading** - 简单快速的loading，适用于轻量级页面
2. **LoadingScreen** - 功能丰富的loading，适用于复杂页面

## 组件说明

### SimpleLoading

适用于首页等简单页面的快速loading。

**特点：**
- 显示时间短（默认800ms）
- 简洁的动画效果
- 轻量级，加载速度快

**使用示例：**
```tsx
import SimpleLoading from '../components/SimpleLoading';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading && <SimpleLoading onLoadingComplete={() => setIsLoading(false)} />}
      <main>页面内容</main>
    </>
  );
}
```

### LoadingScreen

适用于race页面等复杂页面的loading。

**特点：**
- 显示详细的加载步骤
- 支持依赖项等待
- 可配置最小显示时间
- 进度条和百分比显示

**使用示例：**
```tsx
import LoadingScreen from '../components/LoadingScreen';

export default function RacePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  return (
    <>
      {isLoading && (
        <LoadingScreen 
          onLoadingComplete={() => setIsLoading(false)}
          minDisplayTime={2000}
          dependencies={[
            new Promise(resolve => {
              if (mapLoaded) resolve(true);
              else {
                const checkLoaded = () => {
                  if (mapLoaded) resolve(true);
                  else setTimeout(checkLoaded, 100);
                };
                checkLoaded();
              }
            })
          ]}
        />
      )}
      <RaceMap />
    </>
  );
}
```

## 配置选项

### SimpleLoading Props

- `onLoadingComplete?: () => void` - 加载完成回调
- `duration?: number` - 显示时长（默认800ms）

### LoadingScreen Props

- `onLoadingComplete?: () => void` - 加载完成回调
- `minDisplayTime?: number` - 最小显示时间（默认1500ms）
- `dependencies?: Promise<any>[]` - 需要等待的依赖项

## 最佳实践

1. **首页使用SimpleLoading** - 首页内容简单，使用快速loading
2. **复杂页面使用LoadingScreen** - 地图等复杂组件使用详细loading
3. **合理设置显示时间** - 避免loading时间过短或过长
4. **等待真实依赖** - 对于地图等组件，等待实际加载完成

## 自定义

如需自定义loading样式，可以修改以下文件：
- `components/SimpleLoading.tsx` - 简单loading样式
- `components/LoadingScreen.tsx` - 详细loading样式

## 性能考虑

- Loading组件使用CSS动画，性能良好
- 避免在loading期间进行大量计算
- 合理使用依赖项等待，避免无限等待 