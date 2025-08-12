'use client'

import { useState } from 'react'
import { Menu, X, BookOpen, MapPin, Radio, Timer, Users, Globe, Info } from 'lucide-react'
import { useT, useLang, useSetLang } from 'src/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@components/components/ui/card'
import { Button } from '@components/components/ui/button'

export default function ManualPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('getting-started')
  const t = useT()
  const lang = useLang()
  const setLang = useSetLang()

  const sections = [
    { id: 'getting-started', title: lang === 'zh' ? '快速开始' : 'Getting Started', icon: BookOpen },
    { id: 'course-setup', title: lang === 'zh' ? '赛道设置' : 'Course Setup', icon: MapPin },
    { id: 'mqtt-connection', title: lang === 'zh' ? 'MQTT连接' : 'MQTT Connection', icon: Radio },
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
        ← {lang === 'zh' ? '首页' : 'Home'}
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
                <strong>信号船模式 (Admin)</strong>：发布位置信息，设置赛道参数
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <strong>观察员模式 (Observer)</strong>：接收信号船位置，查看其他裁判位置
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
              <p className="text-sm text-muted-foreground">生成房间码的设备自动成为信号船，其他设备为观察员。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
    'course-setup': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">赛道设置</h1>
          <p className="text-muted-foreground mb-6">
            信号船可以设置不同类型的赛道，系统支持多种标准赛道类型。
          </p>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Simple 基础赛道</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• 轴向角度：赛道主轴方向</li>
                <li>• 距离：从起始线到上风标的距离（海里）</li>
                <li>• 起始线长度：起始线的长度（米）</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>One Four 标准赛道</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• 包含标记点4的宽度和距离参数</li>
                <li>• 适用于更复杂的赛道布局</li>
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
              <li>1. 点击地图上的设置按钮</li>
              <li>2. 选择赛道类型</li>
              <li>3. 输入相应参数</li>
              <li>4. 确认设置，赛道会实时显示在地图上</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    ),
    'mqtt-connection': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">MQTT连接</h1>
          <p className="text-muted-foreground mb-6">
            系统使用MQTT协议实现实时位置同步，无需复杂配置即可使用。
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>连接状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">已连接 - 正常运行状态</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">连接中 - 正在建立连接</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">连接失败 - 检查网络连接</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>故障排除</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• 检查设备网络连接</li>
              <li>• 确认防火墙设置</li>
              <li>• 尝试刷新页面重新连接</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    ),
    'timing': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">计时功能</h1>
          <p className="text-muted-foreground mb-6">
            系统提供精确的比赛计时功能，支持倒计时和正计时模式。
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>计时器类型</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• <strong>倒计时</strong>：比赛前倒计时，常用于起始准备</li>
              <li>• <strong>正计时</strong>：比赛开始后的计时</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>使用方法</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li>1. 访问 /timer 页面</li>
              <li>2. 设置所需的计时时间</li>
              <li>3. 点击开始/暂停按钮控制计时器</li>
              <li>4. 使用重置按钮清空计时</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    ),
    'multi-user': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">多用户模式</h1>
          <p className="text-muted-foreground mb-6">
            系统支持多个裁判同时在线，实时查看彼此位置和状态。
          </p>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>信号船 (Admin)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• 设置赛道参数</li>
                <li>• 发布位置信息</li>
                <li>• 控制比赛流程</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>观察员 (Observer)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• 接收赛道信息</li>
                <li>• 查看所有用户位置</li>
                <li>• 协助比赛监督</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>在线状态</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              地图右下角显示当前在线用户数量，包括信号船和所有观察员。
            </p>
          </CardContent>
        </Card>
      </div>
    ),
    'about': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">关于我们</h1>
          <p className="text-muted-foreground mb-6">
            我们是一支专注于帆船比赛数字化与智能化的团队，致力于为裁判与赛事组织者提供更高效、可靠的工具。
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>团队成员</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <strong>周亮</strong>：国际级开赛官（IRO），中国
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <strong>郭麟</strong>：开发者，UK Sailmakers 设计师
              </div>
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
                <strong>Signal Boat Mode (Admin)</strong>: Broadcasts position information, sets course parameters
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <strong>Observer Mode</strong>: Receives signal boat position, views other judges' positions
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
      </div>
    ),
    'course-setup': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">Course Setup</h1>
          <p className="text-muted-foreground mb-6">
            Signal boat can set different types of courses. The system supports multiple standard course types.
          </p>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Simple Course</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Axis angle: Main course direction</li>
                <li>• Distance: Distance from start line to windward mark (nautical miles)</li>
                <li>• Start line length: Length of the start line (meters)</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>One Four Course</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Includes mark 4 width and distance parameters</li>
                <li>• Suitable for more complex course layouts</li>
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
              <li>1. Click the settings button on the map</li>
              <li>2. Select course type</li>
              <li>3. Enter required parameters</li>
              <li>4. Confirm settings, course will display on map in real-time</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    ),
    'mqtt-connection': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">MQTT Connection</h1>
          <p className="text-muted-foreground mb-6">
            The system uses MQTT protocol for real-time position synchronization, no complex configuration required.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Connected - Normal operation</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Connecting - Establishing connection</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">Connection failed - Check network</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Check device network connection</li>
              <li>• Verify firewall settings</li>
              <li>• Try refreshing page to reconnect</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    ),
    'timing': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">Timer Function</h1>
          <p className="text-muted-foreground mb-6">
            The system provides precise race timing with countdown and count-up modes.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Timer Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• <strong>Countdown</strong>: Pre-race countdown, commonly used for start preparation</li>
              <li>• <strong>Count-up</strong>: Timer after race start</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li>1. Visit /timer page</li>
              <li>2. Set desired timer duration</li>
              <li>3. Use start/pause button to control timer</li>
              <li>4. Use reset button to clear timer</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    ),
    'multi-user': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">Multi-user Mode</h1>
          <p className="text-muted-foreground mb-6">
            The system supports multiple judges online simultaneously, with real-time position and status viewing.
          </p>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Signal Boat (Admin)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Set course parameters</li>
                <li>• Broadcast position information</li>
                <li>• Control race flow</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Observer</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Receive course information</li>
                <li>• View all user positions</li>
                <li>• Assist with race supervision</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Online Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Bottom right of the map shows current online user count, including signal boat and all observers.
            </p>
          </CardContent>
        </Card>
      </div>
    ),
    'about': (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">About Us</h1>
          <p className="text-muted-foreground mb-6">
            We build reliable, efficient tools to digitalize and modernize sailing race management for judges and organizers.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <strong>Zhou Liang</strong>: International Race Officer (IRO), China
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <strong>Guo Lin</strong>: Developer, Designer at UK Sailmakers
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const content = lang === 'zh' ? zhContent : enContent
  return content[activeSection as keyof typeof content] || <div>Loading content...</div>
}