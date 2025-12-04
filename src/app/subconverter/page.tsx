'use client'
import { useState, useRef } from 'react'

export default function SubConverter() {
  const [currentTab, setCurrentTab] = useState<'url' | 'nodes'>('url')
  const [urlInput, setUrlInput] = useState('')
  const [nodesInput, setNodesInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [convertedLink, setConvertedLink] = useState('')
  const [showResult, setShowResult] = useState(false)

  const processNodes = (nodesText: string): string => {
    const nodes = nodesText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('|')
    return encodeURIComponent(nodes)
  }

  const validateInput = (): { isValid: boolean; processedUrl: string } => {
    if (currentTab === 'url') {
      if (!urlInput.trim()) {
        alert('请输入订阅链接')
        return { isValid: false, processedUrl: '' }
      }

      try {
        new URL(urlInput)
        return { isValid: true, processedUrl: urlInput }
      } catch {
        alert('请输入有效的URL格式')
        return { isValid: false, processedUrl: '' }
      }
    } else {
      if (!nodesInput.trim()) {
        alert('请输入节点配置')
        return { isValid: false, processedUrl: '' }
      }

      const lines = nodesInput.split('\n').filter(line => line.trim())
      if (lines.length === 0) {
        alert('请输入有效的节点配置')
        return { isValid: false, processedUrl: '' }
      }

      const validProtocols = [
        'ss://',
        'vmess://',
        'trojan://',
        'hysteria2://',
        'vless://',
      ]
      const hasValidNode = lines.some(line =>
        validProtocols.some(protocol => line.trim().startsWith(protocol))
      )

      if (!hasValidNode) {
        alert('未检测到有效的节点配置格式')
        return { isValid: false, processedUrl: '' }
      }

      return { isValid: true, processedUrl: processNodes(nodesInput) }
    }
  }

  const convertSubscription = async () => {
    if (isLoading) return

    const { isValid, processedUrl } = validateInput()
    if (!isValid) return

    setIsLoading(true)
    setShowResult(false)

    try {
      const requestUrl = `http://localhost:25500/sub?target=clash&url=${processedUrl}&config=ACL4SSR_Clash_Meta.ini&udp=true&emoji=false&flag=meta&list=true`

      console.log('请求URL:', requestUrl)

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'SubConverter/1.0.0',
          'Accept': '*/*',
          'Connection': 'keep-alive',
        },
        redirect: 'follow',
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `服务器错误 ${response.status}: ${errorText || '未知错误'}`
        )
      }

      const responseText = await response.text()
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('服务器返回空内容，请检查输入参数')
      }

      setConvertedLink(requestUrl)
      setShowResult(true)
    } catch (error) {
      console.error('转换失败:', error)
      alert('转换失败: ' + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(convertedLink)

      // 简单的成功提示
      const copyBtn = document.activeElement as HTMLButtonElement
      if (copyBtn) {
        const originalText = copyBtn.textContent
        copyBtn.textContent = '已复制！'
        copyBtn.style.color = '#059669'
        copyBtn.style.fontWeight = '600'

        setTimeout(() => {
          copyBtn.textContent = originalText || '复制链接'
          copyBtn.style.color = ''
          copyBtn.style.fontWeight = ''
        }, 2000)
      }
    } catch (error) {
      console.error('复制失败:', error)
      try {
        const urlElement = document.getElementById('convertedUrl')
        if (urlElement) {
          const range = document.createRange()
          range.selectNode(urlElement)
          window.getSelection()?.removeAllRanges()
          window.getSelection()?.addRange(range)
          alert('自动复制失败，已为您选中文本，请手动复制')
        }
      } catch (fallbackError) {
        alert('复制失败，请手动选择并复制链接')
      }
    }
  }

  const clearAll = () => {
    setUrlInput('')
    setNodesInput('')
    setShowResult(false)
    setConvertedLink('')
    setCurrentTab('url')
  }

  const switchTab = (tab: 'url' | 'nodes') => {
    setCurrentTab(tab)
    setShowResult(false)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">节点转换器</h1>
          <p className="text-gray-600 text-lg">
            将您的订阅链接或节点配置转换为不同格式
          </p>
        </div>

        {/* 主要内容 */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          {/* 输入类型选择 */}
          <div className="mb-6">
            <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => switchTab('url')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  currentTab === 'url'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                订阅链接
              </button>
              <button
                onClick={() => switchTab('nodes')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  currentTab === 'nodes'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                节点配置
              </button>
            </div>
          </div>

          {/* URL 输入区域 */}
          {currentTab === 'url' && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                订阅链接 URL
              </label>
              <div>
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="请输入您的订阅链接..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 transition-all"
                  onKeyPress={e => e.key === 'Enter' && convertSubscription()}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                支持各种订阅链接格式，如 V2Ray、Clash、Shadowsocks 等
              </p>
            </div>
          )}

          {/* 节点配置输入区域 */}
          {currentTab === 'nodes' && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                节点配置
              </label>
              <div>
                <textarea
                  rows={8}
                  value={nodesInput}
                  onChange={e => setNodesInput(e.target.value)}
                  placeholder="请输入节点配置，每行一个节点，例如：&#10;ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@192.168.1.1:8080#节点1&#10;vmess://eyJ2IjoiMiIsInBzIjoi...&#10;trojan://password@example.com:443#节点2"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-700 font-mono text-sm resize-vertical transition-all"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                支持 SS、VMess、Trojan 等节点配置，每行一个节点
              </p>
            </div>
          )}

          {/* 转换按钮 */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={convertSubscription}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium px-8 py-3 rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  转换中...
                </span>
              ) : (
                '开始转换'
              )}
            </button>
            <button
              onClick={clearAll}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-8 py-3 rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              清空
            </button>
          </div>

          {/* 结果区域 */}
          {showResult && (
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                转换结果
              </h3>

              {/* 成功状态 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-green-800 font-medium">转换成功！</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    转换后的链接：
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                  >
                    复制链接
                  </button>
                </div>
                <div
                  id="convertedUrl"
                  className="bg-white border rounded p-3 font-mono text-xs text-gray-800 break-all max-h-48 overflow-y-auto leading-relaxed"
                >
                  {convertedLink}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 使用说明 */}
        <div className="mt-12 bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">使用说明</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">订阅链接模式</h4>
              <ul className="space-y-1 text-gray-600 text-sm">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  输入您的原始订阅链接
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  支持 V2Ray、Clash、SS 等订阅
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">节点配置模式</h4>
              <ul className="space-y-1 text-gray-600 text-sm">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  每行输入一个节点配置
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  自动处理并编码为订阅格式
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
