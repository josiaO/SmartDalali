import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { Star, User } from 'lucide-react';
import { fetchAgentRatings, fetchAgentRatingStats, type AgentRating } from '@/api/admin';

export default function RatingsReviews() {
  const { data: ratings, isLoading } = useQuery({
    queryKey: ['agent-ratings'],
    queryFn: fetchAgentRatings,
  });

  const { data: stats } = useQuery({
    queryKey: ['agent-rating-stats'],
    queryFn: fetchAgentRatingStats,
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
          />
        ))}
      </div>
    );
  };

  const getAverageRating = (agentId: number) => {
    const agentRatings = ratings?.filter((r) => r.agent === agentId) || [];
    if (agentRatings.length === 0) return 0;
    const sum = agentRatings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / agentRatings.length).toFixed(1);
  };

  const getAgentStats = () => {
    if (!ratings || !Array.isArray(ratings)) return [];

    const agentMap = new Map<number, { name: string; count: number; avg: string }>();

    ratings.forEach((rating) => {
      if (!agentMap.has(rating.agent)) {
        agentMap.set(rating.agent, {
          name: rating.agent_name || 'Unknown Agent',
          count: 0,
          avg: '0',
        });
      }
      const agentStats = agentMap.get(rating.agent)!;
      agentStats.count += 1;
      const avgRating = getAverageRating(rating.agent);
      agentStats.avg = typeof avgRating === 'string' ? avgRating : avgRating.toString();
    });

    return Array.from(agentMap.entries()).map(([id, agentStats]) => ({
      id,
      ...agentStats,
    }));
  };

  if (isLoading) {
    return <Card><CardContent className="p-8 text-center">Loading ratings...</CardContent></Card>;
  }

  const agentStats = getAgentStats();

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Ratings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_ratings || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{stats.average_rating || 0}</div>
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Rated Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agentStats.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agent Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Rating Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agentStats.map((agent) => (
              <div key={agent.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  <span className="font-semibold">{agent.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-bold">{agent.avg}</span>
                  </div>
                  <Badge variant="secondary">
                    {agent.count} {agent.count === 1 ? 'review' : 'reviews'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ratings?.map((rating) => (
              <div key={rating.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">
                        {rating.agent_name || 'Unknown Agent'}
                      </span>
                      <Badge variant="outline">Agent</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Reviewed by {rating.user_name || 'Anonymous'}
                    </div>
                    {rating.property_title && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Property: {rating.property_title}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {renderStars(rating.rating)}
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {rating.review && (
                  <p className="text-sm text-muted-foreground mt-2">
                    "{rating.review}"
                  </p>
                )}
              </div>
            ))}
            {!ratings || ratings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No ratings yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
