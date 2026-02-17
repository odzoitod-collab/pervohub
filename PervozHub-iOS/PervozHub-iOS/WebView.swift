import SwiftUI
import WebKit

/// Обёртка WKWebView для SwiftUI — показує веб-сторінку або локальний HTML.
struct WebView: UIViewRepresentable {
    let url: URL?
    let htmlFileName: String?

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = UIColor(red: 250/255, green: 250/255, blue: 250/255, alpha: 1)

        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        if let url = url {
            webView.load(URLRequest(url: url))
            return
        }
        if let name = htmlFileName,
           let path = Bundle.main.path(forResource: name, ofType: "html"),
           let html = try? String(contentsOfFile: path, encoding: .utf8) {
            let baseURL = URL(fileURLWithPath: path).deletingLastPathComponent()
            webView.loadHTMLString(html, baseURL: baseURL)
        }
    }
}
