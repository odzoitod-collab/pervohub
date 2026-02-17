import SwiftUI

struct ContentView: View {
    /// Замініть на свій URL, якщо сайт вже задеплоєний. Інакше використовується локальний lendos.html.
    private static let siteURL = "https://your-site.com"  // або nil для тільки локального HTML

    private var loadURL: URL? {
        guard let urlString = Self.siteURL.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              !urlString.isEmpty,
              urlString != "https://your-site.com",
              let url = URL(string: urlString) else { return nil }
        return url
    }

    var body: some View {
        WebView(
            url: loadURL,
            htmlFileName: loadURL == nil ? "lendos" : nil
        )
        .ignoresSafeArea(.container, edges: .bottom)
    }
}

#Preview {
    ContentView()
}
