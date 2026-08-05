import random

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from .serializers import UserSerializer

# Skill categories from the requirement doc (2.2.1), used to steer
# generation toward variety.
SKILL_CATEGORIES = ['cognitive', 'physical', 'creative', 'social', 'practical']

# Built-in task database (requirement 2.2.1), used when no Anthropic key is
# configured or the API call fails. Entries per age group span the
# categories above.
FALLBACK_SKILLS = {
    'kids': [
        "Origami Fun: Learn to fold paper into animals and shapes! Origami builds fine motor skills and patience. First step: fold a simple paper boat and float it in the sink.",
        "Backyard Scavenger Hunt: Create and complete a nature scavenger hunt! It sharpens observation skills and gets you moving outdoors. First step: write a list of five things to find, like a smooth rock or a yellow leaf.",
        "Story Drawing: Draw a comic strip that tells a short story! This boosts creativity and storytelling. First step: fold a paper into four boxes and draw what happens first.",
        "Soft-Ball Juggling: Learn to juggle with two soft balls! Juggling improves hand-eye coordination and focus. First step: practice tossing one ball from hand to hand ten times.",
        "Plant a Seed: Plant a seed in a cup and care for it daily! It teaches responsibility and patience. First step: put a bean seed on a wet paper towel in a jar by the window.",
        "Memory Match Master: Play a card memory game and try to beat your own score! It trains concentration and memory. First step: lay out ten cards face down and find the pairs.",
        "Show-and-Tell Star: Practice telling a two-minute story about your favorite toy! It builds confidence speaking to others. First step: pick one object and practice in front of a mirror.",
        "Knot Wizard: Learn to tie three useful knots! Knots build finger strength and problem-solving. First step: learn the square knot with a shoelace.",
        "Freeze Dance Champion: Dance until the music stops, then freeze like a statue! It builds balance and body control. First step: ask someone to play a song and pause it three times.",
        "Riddle Detective: Solve three riddles and then invent your own! Riddles stretch your thinking in fun ways. First step: ask a grown-up for one riddle and try to crack it before dinner.",
    ],
    'teens': [
        "Build a Tiny Website: Code a one-page site about something you love. Coding sharpens problem-solving and looks great on applications. First step: open a free editor like replit.com and write your first HTML heading.",
        "Ten-Minute Journal: Write about your day or your goals each evening. Journaling improves self-awareness and is a healthy outlet for stress. First step: write three sentences about the best part of today.",
        "Cook One Real Meal: Pick a recipe and cook it from scratch. Cooking builds independence and confidence. First step: choose a simple pasta recipe and make the shopping list.",
        "Two-Minute Talks: Record yourself speaking about a topic you love. Public speaking builds confidence for class and interviews. First step: record one take on your phone and watch it back.",
        "Phone Photography: Practice composition and lighting with your phone camera. Photography trains you to see the world creatively. First step: shoot the same object from five different angles.",
        "Chess Tactics Sprint: Solve chess puzzles to sharpen calculation and patience. Tactics training builds pattern recognition fast. First step: solve five free puzzles on lichess.org.",
        "Sketchnote Your Classes: Turn notes into quick drawings and diagrams. Sketchnoting makes studying stick and is fun to flip through. First step: redraw today's hardest concept as a doodle with labels.",
        "Pocket-Money Budget: Track every dollar you spend for one week. Budgeting is a life skill that buys you freedom later. First step: write down today's spending in a notes app.",
        "Start a Pickup Game: Organize friends for a casual game of anything. Organizing builds leadership and keeps you active. First step: message three friends with a time and place.",
        "Learn Three Guitar Chords: G, C and D unlock hundreds of songs. Music practice builds discipline and is a great social skill. First step: watch one chord tutorial and practice switching for ten minutes.",
    ],
    'adults': [
        "Mindful Morning Routine: Start your day with ten minutes of stretching and deep breathing. It reduces stress and sets a calm tone. First step: put your alarm ten minutes earlier tonight.",
        "Fifteen-Minute Language Habit: Learn a new language in small daily sessions. It keeps your mind sharp and opens cultural doors. First step: install a free app and finish one lesson today.",
        "Meal Prep Sunday: Plan and prepare your meals for the week ahead. It saves money and removes daily decision fatigue. First step: pick two recipes and write the grocery list.",
        "Everyday Sketching: Spend twenty minutes drawing ordinary objects. Sketching is meditative and trains observation. First step: draw your coffee mug without lifting the pen.",
        "One-Drawer Declutter: Organize a single drawer completely. Small wins reduce mental load and build momentum. First step: empty the drawer onto the table and sort into keep/donate/toss.",
        "Touch-Typing Tune-Up: Retrain your typing speed and accuracy. Faster typing pays off every single day at a keyboard. First step: take a one-minute test at a free typing site to get your baseline.",
        "Podcast Walks: Take a thirty-minute walk while learning from a podcast. It pairs light exercise with fresh ideas. First step: queue one episode and walk around the block tonight.",
        "Write a Real Letter: Hand-write a letter to someone you appreciate. It deepens relationships in a way texts can't. First step: pick the person and write the first paragraph.",
        "Knife Skills Basics: Learn proper dicing and slicing technique. Good knife skills make cooking faster and safer. First step: watch one technique video and practice on an onion.",
        "Learn Three Ukulele Chords: C, F and G7 unlock dozens of songs. Music practice is a joyful stress-reliever. First step: borrow or buy a cheap uke and tune it with a free app.",
    ],
}

# Canned coaching tips keyed by progress stage, used when no API key is set.
FALLBACK_COACH_TIPS = {
    'starting': (
        "You're just getting started with \"{skill}\" — great choice. "
        "Keep the first session tiny: 15 focused minutes, one concrete goal, no pressure to be good. "
        "Decide when today you'll do it and what 'done' looks like for this one session. "
        "(Set ANTHROPIC_API_KEY on the server to unlock the full AI coach.)"
    ),
    'practicing': (
        "You've made a start on \"{skill}\" — momentum matters more than intensity now. "
        "Pick one small weakness from your last attempt and drill just that for the next session. "
        "A simple test: try to do the basics without looking anything up, and note where you stall. "
        "(Set ANTHROPIC_API_KEY on the server to unlock the full AI coach.)"
    ),
    'refining': (
        "You're refining \"{skill}\" — time to raise the bar. "
        "Set a mini-challenge that would have felt hard two weeks ago, and get feedback from someone else or record yourself. "
        "Compare against your earlier attempts to see how far you've come. "
        "(Set ANTHROPIC_API_KEY on the server to unlock the full AI coach.)"
    ),
}

COACH_SYSTEM_PROMPT = (
    "You are a friendly, practical skill coach inside the SkillUp Daily app. "
    "The user is working on this skill: \"{skill}\". Their self-reported stage is: {stage} "
    "(starting = just beginning, practicing = has made attempts, refining = polishing). "
    "Your job: figure out where they actually are with the skill, and help them progress. "
    "If they're vague about what they want, ask one or two sharp questions to narrow it down. "
    "Draft concrete, small practice plans (what to do, for how long, and what 'done' looks like). "
    "Suggest simple ways to test or evaluate their progress and iterate on the plan. "
    "Stay flexible: if the user wants to keep it loose (e.g. 'just vibe with me, no structured "
    "evaluation'), go along with it and coach in their style. "
    "Keep replies short and conversational — a few sentences, not essays."
)


class SignupView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.id,
                'email': user.email
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.id,
                'email': user.email
            })
        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_400_BAD_REQUEST)


def get_anthropic_client():
    if not settings.ANTHROPIC_API_KEY:
        return None
    import anthropic
    return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


class SkillView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        age_group = request.GET.get('age_group', 'kids')
        if age_group not in FALLBACK_SKILLS:
            age_group = 'kids'
        try:
            count = max(1, min(int(request.GET.get('count', 1)), 10))
        except ValueError:
            count = 1

        skills = []
        for _ in range(count):
            skill = self.generate_skill_with_claude(age_group, exclude=skills)
            if skill:
                skills.append(skill)

        if len(skills) < count:
            pool = [s for s in FALLBACK_SKILLS[age_group] if s not in skills]
            needed = count - len(skills)
            skills.extend(random.sample(pool, min(needed, len(pool))))

        return Response({'skill': skills[0], 'skills': skills})

    def generate_skill_with_claude(self, age_group, exclude=()):
        client = get_anthropic_client()
        if client is None:
            return None
        category = random.choice(SKILL_CATEGORIES)
        try:
            message = client.messages.create(
                model="claude-sonnet-4-5",
                max_tokens=200,
                temperature=1.0,
                system="You suggest specific, fresh skills to learn. Never suggest generic ideas.",
                messages=[
                    {"role": "user", "content": self.build_skill_prompt(age_group, category, exclude)}
                ],
            )
            return message.content[0].text.strip()
        except Exception as e:
            print(f"Error calling Anthropic API, using fallback skills: {e}")
            return None

    def build_skill_prompt(self, age_group, category, exclude=()):
        audiences = {
            'kids': "a child aged 5-12 (easy for parents to facilitate, playful and safe)",
            'teens': "a teenager aged 13-18 (builds confidence, useful for school or social life)",
            'adults': "a busy adult (fits into daily life, aids growth or relaxation)",
        }
        prompt = (
            f"Suggest one specific {category} skill or hobby for {audiences[age_group]}. "
            "Avoid generic suggestions like 'start journaling', 'learn to cook', or 'try meditation' — "
            "pick something concrete and a little unexpected. "
            "Format: a punchy heading of at most six words, then a colon, then a 2-3 sentence "
            "description of the benefit that ends with one clear first action they can take today. "
            "Return only that text, no preamble."
        )
        if exclude:
            listed = "; ".join(s.split(':')[0] for s in exclude)
            prompt += f" Do not suggest any of these again: {listed}."
        return prompt


class CoachView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        skill = (request.data.get('skill') or '').strip()
        stage = request.data.get('stage', 'starting')
        if stage not in FALLBACK_COACH_TIPS:
            stage = 'starting'
        messages = request.data.get('messages') or []
        if not skill:
            return Response({'error': 'skill is required'}, status=status.HTTP_400_BAD_REQUEST)

        reply = self.coach_with_claude(skill, stage, messages)
        if reply is None:
            reply = FALLBACK_COACH_TIPS[stage].format(skill=skill.split(':')[0])
        return Response({'reply': reply})

    def coach_with_claude(self, skill, stage, messages):
        client = get_anthropic_client()
        if client is None:
            return None

        conversation = [
            {'role': m['role'], 'content': m['content']}
            for m in messages
            if isinstance(m, dict) and m.get('role') in ('user', 'assistant') and m.get('content')
        ]
        if not conversation or conversation[0]['role'] != 'user':
            conversation.insert(0, {'role': 'user', 'content': "I'd like some coaching on this skill."})

        try:
            message = client.messages.create(
                model="claude-sonnet-4-5",
                max_tokens=400,
                system=COACH_SYSTEM_PROMPT.format(skill=skill, stage=stage),
                messages=conversation,
            )
            return message.content[0].text.strip()
        except Exception as e:
            print(f"Error calling Anthropic API, using fallback coach tip: {e}")
            return None


IMPROVE_SYSTEM_PROMPT = (
    "You rewrite skill suggestions to be sharper and more actionable. "
    "Keep the same core idea. Format: a punchy heading of at most six words, "
    "then a colon, then 2-3 sentences that explain the benefit and end with "
    "one clear first action. Return only that text, no preamble or quotes."
)


def fallback_improve_skill(skill: str) -> str:
    """Light local rewrite when Anthropic is unavailable."""
    if ':' in skill:
        heading, _, body = skill.partition(':')
        heading = heading.strip()
        body = ' '.join(body.strip().split())
        if not body.endswith('.'):
            body = body.rstrip('.') + '.'
        if 'First step:' not in body and 'first step:' not in body:
            body += ' First step: spend fifteen focused minutes on the basics today.'
        return f"{heading}: {body}"
    cleaned = ' '.join(skill.strip().split())
    return (
        f"{cleaned.split('.')[0][:40].rstrip()}: {cleaned} "
        "First step: block fifteen minutes today and take the smallest possible first action."
    )


class ImproveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        skill = (request.data.get('skill') or '').strip()
        if not skill:
            return Response({'error': 'skill is required'}, status=status.HTTP_400_BAD_REQUEST)

        improved = self.improve_with_claude(skill)
        if improved is None:
            improved = fallback_improve_skill(skill)
        return Response({'skill': improved})

    def improve_with_claude(self, skill):
        client = get_anthropic_client()
        if client is None:
            return None
        try:
            message = client.messages.create(
                model="claude-sonnet-4-5",
                max_tokens=220,
                temperature=0.7,
                system=IMPROVE_SYSTEM_PROMPT,
                messages=[
                    {
                        'role': 'user',
                        'content': f"Sharpen this skill description:\n\n{skill}",
                    }
                ],
            )
            return message.content[0].text.strip()
        except Exception as e:
            print(f"Error calling Anthropic API, using fallback improve: {e}")
            return None
