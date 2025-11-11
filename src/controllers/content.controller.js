const supabase = require('../config/supabase');

class ContentController {
  /**
   * GET /api/content/:gameType
   * Get game content (scenarios, questions, topics)
   */
  async getContent(req, res) {
    try {
      const { gameType } = req.params;
      const { difficulty } = req.query;

      // For now, return mock data
      // TODO: Replace with Supabase query when game_content table is ready
      
      let contentData;

      switch (gameType) {
        case 'scenario_challenge':
          contentData = {
            content_id: 'scenario-' + Date.now(),
            game_type: 'scenario_challenge',
            scenario: 'You are leading a team working on a critical project with a tight deadline. Two key team members have conflicting approaches to solving the main technical challenge. One favors a conservative, proven solution while the other pushes for an innovative but risky approach. The deadline is in 48 hours.',
            questions: [
              { id: 'q1', question: 'What factors would you consider when evaluating both approaches?', time_limit: 120 },
              { id: 'q2', question: 'How would you facilitate a constructive discussion between the two team members?', time_limit: 120 },
              { id: 'q3', question: 'What decision-making framework would you use to choose the best approach?', time_limit: 120 },
              { id: 'q4', question: 'How would you ensure team alignment and maintain morale regardless of which approach is chosen?', time_limit: 120 }
            ]
          };
          break;

        case 'ai_debate':
          contentData = {
            content_id: 'debate-' + Date.now(),
            game_type: 'ai_debate',
            statement: 'Remote work is more productive than office work for most knowledge workers',
            time_limit_pros: 180,
            time_limit_cons: 180
          };
          break;

        case 'creative_uses':
          contentData = {
            content_id: 'creative-' + Date.now(),
            game_type: 'creative_uses',
            object: 'A Brick',
            time_limit: 60
          };
          break;

        case 'interview':
          contentData = {
            content_id: 'interview-' + Date.now(),
            game_type: 'interview',
            questions: [
              { id: 'q1', question: 'Describe a time when you had to make a difficult decision with limited information. What was your process?', time_limit: 300 },
              { id: 'q2', question: 'Tell me about a situation where you had to influence others without direct authority. How did you approach it?', time_limit: 300 },
              { id: 'q3', question: 'Give an example of when you received critical feedback. How did you respond and what did you learn?', time_limit: 300 },
              { id: 'q4', question: 'Describe a complex problem you solved recently. Walk me through your analytical process.', time_limit: 300 }
            ]
          };
          break;

        case 'statement_reasoning':
          contentData = {
            content_id: 'reasoning-' + Date.now(),
            game_type: 'statement_reasoning',
            statements: [
              'All companies that prioritize employee well-being have lower turnover rates.',
              'TechCorp has invested heavily in mental health programs and flexible work arrangements.',
              'TechCorp\'s turnover rate has decreased by 40% over the past two years.'
            ],
            question: 'Analyze the logical relationship between these statements. What conclusions can and cannot be drawn?',
            time_limit: 180
          };
          break;

        default:
          return res.status(404).json({
            success: false,
            error: 'No content available for game type: ' + gameType
          });
      }

      res.json({
        success: true,
        data: contentData
      });

    } catch (error) {
      console.error('Content fetch error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new ContentController();