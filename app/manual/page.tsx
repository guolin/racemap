'use client'

import { useState } from 'react'
import { Menu, X, BookOpen, MapPin, Radio, Timer, Users, Globe, Info, ArrowLeft } from 'lucide-react'
import { useLang, useSetLang } from 'src/locale'
import { Card, CardContent, CardHeader, CardTitle } from 'components/components/ui/card'
import { Button } from 'components/components/ui/button'

export default function ManualPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('getting-started')
  const lang = useLang()
  const setLang = useSetLang()

  const sections = [
    { id: 'getting-started', title: lang === 'zh' ? '快速开始' : 'Getting Started', icon: BookOpen },
    { id: 'course-setup', title: lang === 'zh' ? '赛道设置' : 'Course Setup', icon: MapPin },
    { id: 'connections', title: lang === 'zh' ? '连接管理' : 'Connections', icon: Radio },
    { id: 'timing', title: lang === 'zh' ? '计时功能' : 'Timer', icon: Timer },
    { id: 'multi-user', title: lang === 'zh' ? '多用户模式' : 'Multi-user Mode', icon: Users },
    { id: 'about', title: lang === 'zh' ? '关于我们' : 'About Us', icon: Info }
  ]

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen)

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile menu button */}
      <Button
        onClick={toggleDrawer}
        size="sm"
        variant="outline"
        className="fixed top-4 left-4 z-50 lg:hidden"
      >
        <Menu className="w-4 h-4" />
      </Button>

      {/* Back to home button */}
      <Button
        onClick={() => window.location.href = '/'}
        size="sm"
        variant="outline"
        className="fixed top-4 right-4 z-50"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        {lang === 'zh' ? '首页' : 'Home'}
      </Button>

      {/* Sidebar/Drawer */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-80 bg-background border-r shadow-lg transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:shadow-none
        ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b relative">
          {/* Close button for mobile */}
          <Button
            onClick={() => setIsDrawerOpen(false)}
            size="sm"
            variant="ghost"
            className="absolute top-4 right-4 lg:hidden"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <h1 className="text-2xl font-bold pr-12 lg:pr-0">{lang === 'zh' ? '使用手册' : 'Manual'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'zh' ? '帆船比赛管理工具' : 'Sailing Race Management Tool'}
          </p>
          
          {/* Language switch */}
          <div className="flex items-center gap-2 mt-4">
            <Globe className="w-4 h-4" />
            <Button
              variant={lang === 'zh' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLang('zh')}
            >
              中文
            </Button>
            <Button
              variant={lang === 'en' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLang('en')}
            >
              English
            </Button>
          </div>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <li key={section.id}>
                  <Button
                    variant={activeSection === section.id ? 'default' : 'ghost'}
                    onClick={() => {
                      setActiveSection(section.id)
                      setIsDrawerOpen(false)
                    }}
                    className="w-full justify-start"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {section.title}
                  </Button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* Overlay for mobile */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-0 pt-16 lg:pt-0">
        <div className="max-w-4xl mx-auto p-6">
          <ManualContent activeSection={activeSection} lang={lang} />
        </div>
      </div>
    </div>
  )
}

function ManualContent({ activeSection, lang }: { activeSection: string; lang: string }) {
  const zhContent = {
    'getting-started': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">快速开始</h1>
          <p className="text-muted-foreground mb-6">
            欢迎使用帆船比赛管理工具！这是一个专为帆船比赛裁判设计的实时位置追踪和赛道管理系统。
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>系统概述</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <strong>起航船模式 (Admin)</strong>：发布位置信息，设置赛道参数，控制比赛流程
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <strong>观察员模式 (Observer)</strong>：接收起航船位置，查看其他裁判位置，协助比赛监督
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>第一次使用</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">1. 获取房间码</h4>
              <p className="text-sm text-muted-foreground">首次访问会自动生成一个6位房间码（如 ABC123），这个码会保存在浏览器中。</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">2. 分享房间码</h4>
              <p className="text-sm text-muted-foreground">将房间码分享给其他裁判，他们使用相同的码进入同一比赛房间。</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">3. 选择角色</h4>
              <p className="text-sm text-muted-foreground">生成房间码的设备自动成为起航船，其他设备为观察员。</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>核心功能</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm">
              <li>• <strong>实时位置同步</strong>：使用MQTT协议实现高精度GPS位置实时同步</li>
              <li>• <strong>动态赛道渲染</strong>：根据风向和比赛参数实时显示赛道布局</li>
              <li>• <strong>多角色支持</strong>：起航船与观察员具有不同的权限和功能</li>
              <li>• <strong>设备方向集成</strong>：支持指南针功能，地图可随设备方向旋转</li>
              <li>• <strong>PWA支持</strong>：支持离线使用，可添加到主屏幕</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    ),
    'course-setup': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">赛道设置</h1>
          <p className="text-muted-foreground mb-6">
            起航船可以设置不同类型的赛道，系统支持多种标准国际赛道类型。
          </p>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>迎尾风航线 (Windward Leeward)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• <strong>轴向角度</strong>：赛道主轴方向，通常与风向一致</li>
                <li>• <strong>距离</strong>：从起始线到上风标的距离（海里）</li>
                <li>• <strong>起始线长度</strong>：起始线的长度（米）</li>
                <li>• <strong>门宽度</strong>：标记门的宽度设置</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>三角形航线 (Triangle)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• <strong>三个顶点</strong>：形成三角形的三个标记点</li>
                <li>• <strong>角度设置</strong>：各边的角度和长度参数</li>
                <li>• <strong>适用赛事</strong>：传统帆船比赛的经典航线</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>OP梯形航线 (Optimist Trapezoid)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• <strong>专为Optimist级别设计</strong>：适合青少年帆船比赛</li>
                <li>• <strong>梯形布局</strong>：四个标记点形成梯形航道</li>
                <li>• <strong>距离优化</strong>：适合小型帆船的航行距离</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SLALOM障碍航线</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• <strong>障碍导航</strong>：通过一系列标记点的技术性航线</li>
                <li>• <strong>技巧测试</strong>：考验船员的操船技术和反应能力</li>
                <li>• <strong>灵活配置</strong>：可根据场地条件调整障碍点位置</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>设置步骤</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li>1. 点击地图右上角的设置按钮 ⚙️</li>
              <li>2. 在赛道设置面板中选择赛道类型</li>
              <li>3. 根据选择的类型输入相应参数（距离、角度、宽度等）</li>
              <li>4. 确认设置后，赛道会实时显示在地图上</li>
              <li>5. 所有观察员设备会自动同步最新的赛道配置</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    ),
    'connections': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">连接管理</h1>
          <p className="text-muted-foreground mb-6">
            系统依赖GPS定位、MQTT通信和网络连接三大核心连接来实现实时位置同步和数据共享。
          </p>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>🔴 网络状态指示器</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold">状态优先级：</h4>
                <p className="text-sm text-muted-foreground">系统采用优先级显示机制，网络问题优先于GPS问题显示</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">网络状态：</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 bg-green-50 rounded border">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">🟢 实时同步中 - 网络和MQTT连接正常</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-red-50 rounded border">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">🔴 网络已断开 - 无法访问互联网</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded border">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">🟡 MQTT连接中... - 网络正常但MQTT未连接</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-orange-50 rounded border">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">🟠 数据可能过期 - 30秒内无数据更新</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">GPS状态图标：</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 bg-green-50 rounded border">
                    <span className="text-sm">🛰️ GPS正常 - 高精度定位已连接</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-orange-50 rounded border">
                    <span className="text-sm">🔄 GPS获取中... - 正在获取位置信息</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded border">
                    <span className="text-sm">📍 GPS精度较差 - 精度超过100米</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-red-50 rounded border">
                    <span className="text-sm">🚫 GPS错误 - 权限被拒绝或定位失败</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📡 MQTT通信机制</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold">连接监控：</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 自动检测MQTT连接状态变化</li>
                  <li>• 监听connect、reconnect、offline、close、error事件</li>
                  <li>• 记录最后数据同步时间</li>
                  <li>• 30秒无数据更新判定为过期状态</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">频道分配：</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 起航船：race/[courseId]/location/admin</li>
                  <li>• 观察员：race/[courseId]/location/observer/[observerId]</li>
                  <li>• 赛道配置：race/[courseId]/course/config</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🛰️ GPS定位系统</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold">精度控制：</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 拒绝精度超过200米的定位数据</li>
                  <li>• 检测GPS跳点（超过2公里跳跃）</li>
                  <li>• 优先使用GPS heading，其次计算航迹方向</li>
                  <li>• 每秒节流更新，避免频繁刷新</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">状态检测：</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 2.5秒内无定位数据判定为离线</li>
                  <li>• 自动检测定位权限和硬件支持</li>
                  <li>• 实时监控定位精度变化</li>
                  <li>• 错误信息自动显示在状态指示器中</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>🔧 故障排除指南</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">GPS定位问题：</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 检查浏览器位置权限是否已授予</li>
                  <li>• 确保在室外开阔环境，避免高楼遮挡</li>
                  <li>• 等待1-2分钟让GPS完成冷启动</li>
                  <li>• 重新加载页面重新申请GPS权限</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">MQTT连接问题：</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 检查防火墙是否阻止WebSocket连接</li>
                  <li>• 尝试切换网络环境（WiFi ↔ 移动网络）</li>
                  <li>• 清除浏览器缓存后重新加载</li>
                  <li>• 确认系统时间准确（误差小于5分钟）</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">网络连接问题：</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 测试网络速度，确保满足最低要求</li>
                  <li>• 靠近WiFi路由器或移动到信号更强区域</li>
                  <li>• 关闭其他大流量应用释放带宽</li>
                  <li>• 重启网络连接或切换网络</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">浏览器兼容性：</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• 推荐：Chrome 90+, Safari 14+, Firefox 88+</li>
                  <li>• 启用JavaScript和位置权限</li>
                  <li>• 禁用广告拦截器中的WebSocket阻止</li>
                  <li>• 使用隐私模式测试排除扩展干扰</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
    'timing': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">计时功能</h1>
          <p className="text-muted-foreground mb-6">
            系统提供专业的比赛计时功能，支持倒计时和正计时模式，满足帆船比赛的各种计时需求。
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>计时器类型</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <strong>倒计时模式</strong>：比赛前倒计时，常用于起始准备程序（如5分钟、4分钟、1分钟信号）
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <strong>正计时模式</strong>：比赛开始后的计时，记录比赛进行时间
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <strong>分段计时</strong>：可设置多个时间节点，用于复杂的比赛程序
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>使用步骤</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li>1. 访问 <code className="bg-gray-100 px-2 py-1 rounded">/timer</code> 页面</li>
              <li>2. 选择计时模式（倒计时/正计时）</li>
              <li>3. 设置所需的时间（分钟:秒格式）</li>
              <li>4. 点击 ▶️ 开始按钮启动计时器</li>
              <li>5. 使用 ⏸️ 暂停/⏯️ 继续按钮控制计时器</li>
              <li>6. 使用 🔄 重置按钮清空计时器</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>比赛应用场景</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-semibold mb-1">起始程序：</h4>
                <p className="text-muted-foreground">5分钟信号 → 4分钟信号 → 1分钟信号 → 起始信号</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">航行时间记录：</h4>
                <p className="text-muted-foreground">记录各条船只的航行时间，用于成绩计算</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">抗议时限：</h4>
                <p className="text-muted-foreground">控制抗议提交的时间窗口</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
    'multi-user': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">多用户模式</h1>
          <p className="text-muted-foreground mb-6">
            系统支持多个裁判同时在线，实现真正的协同作业，提高比赛管理效率。
          </p>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>起航船 (Admin) 权限</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• <strong>赛道配置</strong>：设置和修改所有赛道参数</li>
                <li>• <strong>位置广播</strong>：向所有观察员实时发布起航船位置</li>
                <li>• <strong>比赛控制</strong>：管理比赛流程和时间节点</li>
                <li>• <strong>系统设置</strong>：配置MQTT连接和其他系统参数</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>观察员 (Observer) 功能</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• <strong>赛道查看</strong>：实时接收和显示最新的赛道配置</li>
                <li>• <strong>位置共享</strong>：与其他用户共享自己的GPS位置</li>
                <li>• <strong>团队协作</strong>：查看所有在线裁判的实时位置</li>
                <li>• <strong>数据同步</strong>：自动同步所有比赛相关信息</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>在线状态管理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <strong>实时计数</strong>：地图右下角显示当前在线用户数量
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <strong>用户列表</strong>：可查看所有在线用户的详细信息
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <strong>离线检测</strong>：自动检测并标记离线用户
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>协作工作流程</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li>1. <strong>起航船设置</strong>：配置比赛参数和赛道</li>
              <li>2. <strong>观察员加入</strong>：使用房间码加入比赛</li>
              <li>3. <strong>位置同步</strong>：所有设备开始GPS位置共享</li>
              <li>4. <strong>协同监督</strong>：各位置裁判协作进行比赛监督</li>
              <li>5. <strong>数据记录</strong>：系统自动记录所有关键事件和时间点</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    ),
    'about': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">关于我们</h1>
          <p className="text-muted-foreground mb-6">
            我们是一支专注于帆船比赛数字化与智能化的团队，致力于为裁判与赛事组织者提供更高效、可靠的现代化工具。
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>核心团队</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                ZL
              </div>
              <div>
                <h4 className="font-semibold">周亮</h4>
                <p className="text-sm text-muted-foreground">国际级开赛官（IRO），中国</p>
                <p className="text-xs text-muted-foreground mt-1">丰富的国际帆船比赛裁判经验，深度参与产品设计和功能需求定义</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                GL
              </div>
              <div>
                <h4 className="font-semibold">郭麟</h4>
                <p className="text-sm text-muted-foreground">全栈开发者，UK Sailmakers 设计师</p>
                <p className="text-xs text-muted-foreground mt-1">负责系统架构设计、技术实现和产品开发</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>技术架构</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">前端技术栈：</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Next.js 13 (App Router)</li>
                  <li>• React 18 + TypeScript</li>
                  <li>• Leaflet 地图引擎</li>
                  <li>• Tailwind CSS</li>
                  <li>• PWA 支持</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">核心特性：</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• MQTT 实时通信</li>
                  <li>• GPS 高精度定位</li>
                  <li>• 设备方向感知</li>
                  <li>• 离线数据缓存</li>
                  <li>• 响应式设计</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>项目愿景</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              我们的目标是将传统的帆船比赛管理带入数字化时代，通过先进的技术手段提高比赛的准确性、效率和公平性。
              我们相信技术应该服务于体育，让裁判能够专注于比赛本身，而不是繁琐的技术操作。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>联系我们</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-muted-foreground">
              如果您有任何问题、建议或希望参与项目开发，欢迎通过以下方式联系我们：
            </p>
            <div className="mt-3 space-y-1 text-muted-foreground">
              <p>📧 邮箱：sailing.tech.team@example.com</p>
              <p>🐙 GitHub：github.com/sailing-race-management</p>
              <p>💬 微信群：请扫描二维码加入技术交流群</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const enContent = {
    'getting-started': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">Getting Started</h1>
          <p className="text-muted-foreground mb-6">
            Welcome to the Sailing Race Management Tool! This is a real-time position tracking and course management system designed specifically for sailing race judges.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <strong>Signal Boat Mode (Admin)</strong>: Broadcasts position information, sets course parameters, controls race flow
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <strong>Observer Mode</strong>: Receives signal boat position, views other judges&apos; positions, assists with race supervision
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>First Time Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">1. Get Room Code</h4>
              <p className="text-sm text-muted-foreground">First visit automatically generates a 6-character room code (e.g., ABC123), saved in browser.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">2. Share Room Code</h4>
              <p className="text-sm text-muted-foreground">Share the room code with other judges to join the same race room.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">3. Role Assignment</h4>
              <p className="text-sm text-muted-foreground">Device that generates the room code becomes signal boat, others become observers.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Core Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm">
              <li>• <strong>Real-time Position Sync</strong>: High-precision GPS position sync via MQTT protocol</li>
              <li>• <strong>Dynamic Course Rendering</strong>: Real-time course display based on wind direction and race parameters</li>
              <li>• <strong>Multi-role Support</strong>: Different permissions and functions for signal boat and observers</li>
              <li>• <strong>Device Orientation Integration</strong>: Compass support with map rotation following device orientation</li>
              <li>• <strong>PWA Support</strong>: Offline usage and add-to-homescreen capability</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    ),
    'course-setup': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">Course Setup</h1>
          <p className="text-muted-foreground mb-6">
            Signal boat can set different types of courses. The system supports multiple standard international course types.
          </p>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Windward Leeward Course</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Axis Angle</strong>: Main course direction, typically aligned with wind direction</li>
                <li>• <strong>Distance</strong>: Distance from start line to windward mark (nautical miles)</li>
                <li>• <strong>Start Line Length</strong>: Length of the start line (meters)</li>
                <li>• <strong>Gate Width</strong>: Width settings for mark gates</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Triangle Course</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Three Vertices</strong>: Three marks forming a triangular course</li>
                <li>• <strong>Angle Settings</strong>: Angle and length parameters for each leg</li>
                <li>• <strong>Applications</strong>: Classic course for traditional sailing races</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Optimist Trapezoid Course</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Optimist Class Specific</strong>: Designed for youth sailing competitions</li>
                <li>• <strong>Trapezoid Layout</strong>: Four marks forming a trapezoidal course</li>
                <li>• <strong>Distance Optimized</strong>: Suitable sailing distances for small boats</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SLALOM Course</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Obstacle Navigation</strong>: Technical course through a series of marks</li>
                <li>• <strong>Skill Testing</strong>: Tests crew boat handling and reaction skills</li>
                <li>• <strong>Flexible Configuration</strong>: Adjustable mark positions based on venue conditions</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Setup Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li>1. Click the settings button ⚙️ in the top right of the map</li>
              <li>2. Select course type in the course settings panel</li>
              <li>3. Enter required parameters based on selected type (distance, angle, width, etc.)</li>
              <li>4. Confirm settings, course will display on map in real-time</li>
              <li>5. All observer devices will automatically sync the latest course configuration</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    ),
    'connections': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">Connection Management</h1>
          <p className="text-muted-foreground mb-6">
            The system relies on three core connections: GPS positioning, MQTT communication, and network connectivity to enable real-time position synchronization and data sharing.
          </p>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>🔴 Network Status Indicator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold">Status Priority:</h4>
                <p className="text-sm text-muted-foreground">System uses priority display mechanism, network issues take precedence over GPS issues</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Network Status:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 bg-green-50 rounded border">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">🟢 Real-time sync - Network and MQTT connected</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-red-50 rounded border">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">🔴 Network disconnected - No internet access</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded border">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">🟡 MQTT connecting... - Network OK but MQTT not connected</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-orange-50 rounded border">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">🟠 Data may be stale - No updates in 30 seconds</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">GPS Status Icons:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 bg-green-50 rounded border">
                    <span className="text-sm">🛰️ GPS OK - High precision positioning connected</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-orange-50 rounded border">
                    <span className="text-sm">🔄 GPS acquiring... - Getting position data</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded border">
                    <span className="text-sm">📍 GPS poor accuracy - Accuracy over 100m</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-red-50 rounded border">
                    <span className="text-sm">🚫 GPS error - Permission denied or positioning failed</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📡 MQTT Communication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold">Connection Monitoring:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Auto-detect MQTT connection status changes</li>
                  <li>• Monitor connect, reconnect, offline, close, error events</li>
                  <li>• Record last data sync time</li>
                  <li>• 30 seconds without updates considered stale</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Topic Allocation:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Signal Boat: race/[courseId]/location/admin</li>
                  <li>• Observers: race/[courseId]/location/observer/[observerId]</li>
                  <li>• Course Config: race/[courseId]/course/config</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🛰️ GPS Positioning System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold">Accuracy Control:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Reject positioning data with accuracy over 200m</li>
                  <li>• Detect GPS jumps (over 2km jumps)</li>
                  <li>• Prioritize GPS heading, fallback to calculated track</li>
                  <li>• Throttled updates every second to avoid excessive refresh</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Status Detection:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Considered offline if no positioning data in 2.5 seconds</li>
                  <li>• Auto-detect positioning permissions and hardware support</li>
                  <li>• Real-time monitoring of positioning accuracy changes</li>
                  <li>• Error messages automatically displayed in status indicator</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>🔧 Troubleshooting Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">GPS Positioning Issues:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Check if browser location permission is granted</li>
                  <li>• Ensure outdoor open environment, avoid tall building obstruction</li>
                  <li>• Wait 1-2 minutes for GPS cold start completion</li>
                  <li>• Reload page to re-request GPS permission</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">MQTT Connection Issues:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Check if firewall blocks WebSocket connections</li>
                  <li>• Try switching network environments (WiFi ↔ Mobile)</li>
                  <li>• Clear browser cache and reload</li>
                  <li>• Confirm system time accuracy (error {'<'}5 minutes)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Network Connection Issues:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Test network speed, ensure minimum requirements</li>
                  <li>• Move closer to WiFi router or stronger signal area</li>
                  <li>• Close other high-bandwidth apps to free bandwidth</li>
                  <li>• Restart network connection or switch networks</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Browser Compatibility:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Recommended: Chrome 90+, Safari 14+, Firefox 88+</li>
                  <li>• Enable JavaScript and location permissions</li>
                  <li>• Disable WebSocket blocking in ad blockers</li>
                  <li>• Use private mode to test and exclude extension interference</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
    'timing': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">Timer Function</h1>
          <p className="text-muted-foreground mb-6">
            The system provides professional race timing with countdown and count-up modes, meeting all sailing race timing requirements.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Timer Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <strong>Countdown Mode</strong>: Pre-race countdown, used for start sequence (e.g., 5-minute, 4-minute, 1-minute signals)
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <strong>Count-up Mode</strong>: Timer after race start, recording race duration
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <strong>Split Timing</strong>: Multiple time checkpoints for complex race procedures
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li>1. Visit <code className="bg-gray-100 px-2 py-1 rounded">/timer</code> page</li>
              <li>2. Select timing mode (countdown/count-up)</li>
              <li>3. Set desired time (minutes:seconds format)</li>
              <li>4. Click ▶️ start button to begin timer</li>
              <li>5. Use ⏸️ pause/⏯️ resume button to control timer</li>
              <li>6. Use 🔄 reset button to clear timer</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Race Application Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-semibold mb-1">Start Sequence:</h4>
                <p className="text-muted-foreground">5-minute signal → 4-minute signal → 1-minute signal → Start signal</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Sailing Time Recording:</h4>
                <p className="text-muted-foreground">Record sailing times for each boat, used for scoring calculations</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Protest Time Limit:</h4>
                <p className="text-muted-foreground">Control time window for protest submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
    'multi-user': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">Multi-user Mode</h1>
          <p className="text-muted-foreground mb-6">
            The system supports multiple judges online simultaneously, enabling true collaborative work and improving race management efficiency.
          </p>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Signal Boat (Admin) Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Course Configuration</strong>: Set and modify all course parameters</li>
                <li>• <strong>Position Broadcasting</strong>: Real-time signal boat position to all observers</li>
                <li>• <strong>Race Control</strong>: Manage race flow and timing checkpoints</li>
                <li>• <strong>System Settings</strong>: Configure MQTT connections and other system parameters</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Observer Functions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Course Viewing</strong>: Real-time receive and display latest course configuration</li>
                <li>• <strong>Position Sharing</strong>: Share own GPS position with other users</li>
                <li>• <strong>Team Collaboration</strong>: View real-time positions of all online judges</li>
                <li>• <strong>Data Synchronization</strong>: Automatic sync of all race-related information</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Online Status Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <strong>Real-time Count</strong>: Bottom right of map shows current online user count
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <strong>User List</strong>: View detailed information of all online users
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <strong>Offline Detection</strong>: Automatic detection and marking of offline users
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collaborative Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li>1. <strong>Signal Boat Setup</strong>: Configure race parameters and course</li>
              <li>2. <strong>Observer Joining</strong>: Join race using room code</li>
              <li>3. <strong>Position Sync</strong>: All devices begin GPS position sharing</li>
              <li>4. <strong>Collaborative Supervision</strong>: Judges collaborate on race supervision from different positions</li>
              <li>5. <strong>Data Recording</strong>: System automatically records all key events and timestamps</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    ),
    'about': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">About Us</h1>
          <p className="text-muted-foreground mb-6">
            We are a team focused on digitalization and modernization of sailing race management, dedicated to providing more efficient and reliable modern tools for judges and race organizers.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Core Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                ZL
              </div>
              <div>
                <h4 className="font-semibold">Zhou Liang</h4>
                <p className="text-sm text-muted-foreground">International Race Officer (IRO), China</p>
                <p className="text-xs text-muted-foreground mt-1">Extensive international sailing race judging experience, deeply involved in product design and feature requirements</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                GL
              </div>
              <div>
                <h4 className="font-semibold">Guo Lin</h4>
                <p className="text-sm text-muted-foreground">Full-stack Developer, Designer at UK Sailmakers</p>
                <p className="text-xs text-muted-foreground mt-1">Responsible for system architecture, technical implementation, and product development</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technical Architecture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Frontend Stack:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Next.js 13 (App Router)</li>
                  <li>• React 18 + TypeScript</li>
                  <li>• Leaflet mapping engine</li>
                  <li>• Tailwind CSS</li>
                  <li>• PWA support</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Core Features:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• MQTT real-time communication</li>
                  <li>• High-precision GPS positioning</li>
                  <li>• Device orientation awareness</li>
                  <li>• Offline data caching</li>
                  <li>• Responsive design</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Vision</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Our goal is to bring traditional sailing race management into the digital age, improving race accuracy, efficiency, and fairness through advanced technology.
              We believe technology should serve sports, allowing judges to focus on the race itself rather than cumbersome technical operations.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-muted-foreground">
              If you have any questions, suggestions, or would like to participate in project development, please contact us:
            </p>
            <div className="mt-3 space-y-1 text-muted-foreground">
              <p>📧 Email: sailing.tech.team@example.com</p>
              <p>🐙 GitHub: github.com/sailing-race-management</p>
              <p>💬 WeChat Group: Please scan QR code to join technical discussion group</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const content = lang === 'zh' ? zhContent : enContent
  return content[activeSection as keyof typeof content] || <div>Loading content...</div>
}