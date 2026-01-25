from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer


class FeedbackSentimentService:
    def __init__(self) -> None:
        self.analyzer = SentimentIntensityAnalyzer()

    def is_positive(self, text: str, threshold: float = 0.05) -> bool:
        if not text:
            return False
        scores = self.analyzer.polarity_scores(text)
        return scores["compound"] >= threshold

    def analyze(self, text: str) -> dict:
        return self.analyzer.polarity_scores(text)
