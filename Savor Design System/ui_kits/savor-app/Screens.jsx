/* global React, RECIPES, FOOD_GRADIENTS, SearchIcon, BookmarkIcon, HomeIcon, ChefIcon, UserIcon, BackIcon, CheckIcon, PlayIcon, PauseIcon, BackIcon, ChevronRight, UsersIcon, TimerIcon, MoreIcon, HeartIcon */

const { useState, useEffect } = React;

/* ====================================================================
   HOME / SEARCH SCREEN
   ==================================================================== */
function HomeScreen({ onOpenRecipe, savedIds, toggleSave, onTab, gridLayout = "card", gridStyle }) {
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState("All");
  const [focused, setFocused] = useState(false);

  const chips = ["All", "Quick", "Vegetarian", "Dinner", "Light", "Comfort"];
  const filtered = RECIPES.filter(r =>
    !query || r.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="app-screen">
      <div className="scroll-area">
        <div className="app-bar">
          <h1>Recipes</h1>
          <button className="icon-btn"><MoreIcon/></button>
        </div>
        <div className={`search-bar${focused ? " focus" : ""}`}>
          <SearchIcon size={18} style={{color:"var(--fg-2)"}}/>
          <input
            placeholder="Search recipes, ingredients…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>
        <div className="chip-row">
          {chips.map(c => (
            <button key={c}
                    className={`chip${chip === c ? " active" : ""}`}
                    onClick={() => setChip(c)}>{c}</button>
          ))}
        </div>

        <div className="eyebrow-line">Top 8 recipes for you</div>

        <div className={"recipe-grid " + (gridLayout === "tight" ? "tight" : gridLayout === "row" ? "row" : "")}
             style={gridStyle}>
          {filtered.slice(0, 8).map(r => (
            <article key={r.id} className="recipe-card" onClick={() => onOpenRecipe(r)}>
              <div className="photo" style={{ background: FOOD_GRADIENTS[r.gradient] }}>
                <button className="icon-btn on-photo save"
                        onClick={(e) => { e.stopPropagation(); toggleSave(r.id); }}>
                  <BookmarkIcon size={14} filled={savedIds.has(r.id)}
                                style={{color: "var(--fg-brand)"}}/>
                </button>
              </div>
              <div className="meta">
                <h3 className="title">{r.title}</h3>
                <div className="sub">
                  <span>{r.time} min</span><span className="dot"/>
                  <span>{r.level}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty-hint">No recipes match "{query}". Try fewer words.</div>
        )}
      </div>

      <TabBar active="home" onTab={onTab}/>
    </div>
  );
}

/* ====================================================================
   RECIPE DETAIL — Ingredients / Steps tabs
   ==================================================================== */
function RecipeDetail({ recipe, onBack, onStartCook, savedIds, toggleSave }) {
  const [tab, setTab] = useState("ingredients");
  const [servings, setServings] = useState(recipe.servings);
  const [checked, setChecked] = useState(() => new Set());

  const toggleCheck = (i) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const ingredients = recipe.ingredients || [];
  const steps = recipe.steps || [];

  return (
    <div className="app-screen">
      <div className="scroll-area" style={{paddingBottom: 120}}>
        <div className="recipe-hero" style={{background: FOOD_GRADIENTS[recipe.gradient]}}>
          <div className="hero-bar">
            <button className="icon-btn on-photo" onClick={onBack}><BackIcon size={20}/></button>
            <button className="icon-btn on-photo"
                    onClick={() => toggleSave(recipe.id)}>
              <BookmarkIcon size={18} filled={savedIds.has(recipe.id)}
                            style={{color:"var(--fg-brand)"}}/>
            </button>
          </div>
          <div className="hero-meta">
            <h1>{recipe.title}</h1>
            <div className="stats">
              <span><TimerIcon size={14}/> {recipe.time} min</span>
              <span><UsersIcon size={14}/> {recipe.servings}</span>
              <span>{recipe.level}</span>
            </div>
          </div>
        </div>

        <div className="tab-strip">
          <button className={tab === "ingredients" ? "active" : ""}
                  onClick={() => setTab("ingredients")}>Ingredients</button>
          <button className={tab === "steps" ? "active" : ""}
                  onClick={() => setTab("steps")}>Steps</button>
        </div>

        {tab === "ingredients" && (
          <>
            <div className="stepper">
              <span className="label">Servings</span>
              <div className="controls">
                <button onClick={() => setServings(Math.max(1, servings - 1))}>−</button>
                <span className="count">{servings}</span>
                <button onClick={() => setServings(servings + 1)}>+</button>
              </div>
            </div>
            <div className="ing-list">
              {ingredients.map((ing, i) => (
                <div key={i}
                     className={`ing-item${checked.has(i) ? " done" : ""}`}
                     onClick={() => toggleCheck(i)}>
                  <div className="check">
                    {checked.has(i) && <CheckIcon size={14} style={{color:"var(--savor-cream)"}}/>}
                  </div>
                  <span className="label">{ing.label}</span>
                  <span className="qty">{ing.qty}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "steps" && (
          <div className="step-list">
            {steps.map((s, i) => (
              <div key={i} className="step-row">
                <div className="num">{i + 1}</div>
                <div>
                  <p className="text">{s.text}</p>
                  {s.timer && (
                    <span className="timer-chip">
                      <TimerIcon size={11}/> {s.timer}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="action-bar">
        <button className="btn-primary" onClick={onStartCook}>
          <PlayIcon size={16}/> Start cooking
        </button>
      </div>
    </div>
  );
}

/* ====================================================================
   COOK MODE
   ==================================================================== */
function CookMode({ recipe, onExit }) {
  const [stepIdx, setStepIdx] = useState(0);
  const steps = recipe.steps || [];
  const step = steps[stepIdx];
  const total = steps.length;

  return (
    <div className="cook-screen">
      <div className="cook-top">
        <button className="icon-btn" onClick={onExit}><BackIcon size={20}/></button>
        <span className="cook-progress">Step {stepIdx + 1} of {total}</span>
        <button className="icon-btn"><MoreIcon/></button>
      </div>

      <div className="cook-photo" style={{background: FOOD_GRADIENTS[recipe.gradient]}}/>

      <div className="cook-body">
        <h2>{step.text.split(".")[0]}.</h2>
        <p>{step.text.split(".").slice(1).join(".").trim()}</p>
        {step.timer && (
          <div className="cook-timer">
            <TimerIcon size={16} style={{color:"var(--fg-brand)"}}/> {step.timer}
          </div>
        )}
      </div>

      <div className="cook-nav">
        <button className="btn-secondary"
                disabled={stepIdx === 0}
                style={{opacity: stepIdx === 0 ? 0.4 : 1}}
                onClick={() => setStepIdx(Math.max(0, stepIdx - 1))}>
          Previous
        </button>
        <button className="btn-primary"
                onClick={() => stepIdx < total - 1 ? setStepIdx(stepIdx + 1) : onExit()}>
          {stepIdx < total - 1 ? "Next step" : "Finish"}
        </button>
      </div>
    </div>
  );
}

/* ====================================================================
   SAVED SCREEN
   ==================================================================== */
function SavedScreen({ savedIds, toggleSave, onOpenRecipe, onTab }) {
  const saved = RECIPES.filter(r => savedIds.has(r.id));

  return (
    <div className="app-screen">
      <div className="scroll-area">
        <div className="app-bar">
          <h1>Saved</h1>
        </div>
        {saved.length === 0 && (
          <div className="empty-hint">
            Nothing saved yet. Tap the bookmark on any recipe to keep it here.
          </div>
        )}
        {saved.map(r => (
          <article key={r.id} className="recipe-card" onClick={() => onOpenRecipe(r)}>
            <div className="photo" style={{ background: FOOD_GRADIENTS[r.gradient] }}>
              <button className="icon-btn on-photo save"
                      onClick={(e) => { e.stopPropagation(); toggleSave(r.id); }}>
                <BookmarkIcon size={16} filled style={{color:"var(--fg-brand)"}}/>
              </button>
            </div>
            <div className="meta">
              <h3 className="title">{r.title}</h3>
              <div className="sub">
                <span>{r.time} min</span><span className="dot"/>
                <span>{r.level}</span><span className="dot"/>
                <span>{r.servings} servings</span>
              </div>
            </div>
          </article>
        ))}
      </div>
      <TabBar active="saved" onTab={onTab}/>
    </div>
  );
}

/* ====================================================================
   PROFILE
   ==================================================================== */
function ProfileScreen({ onTab, savedCount }) {
  const rows = [
    { label: "Saved recipes", meta: `${savedCount}` },
    { label: "Shopping list", meta: "0 items" },
    { label: "Dietary preferences", meta: "Vegetarian" },
    { label: "Units", meta: "Metric" },
    { label: "Notifications", meta: "On" },
    { label: "Help & feedback", meta: "" }
  ];
  return (
    <div className="app-screen">
      <div className="scroll-area">
        <div className="profile-header">
          <div className="avatar">M</div>
          <div className="name">Maya Patel</div>
          <div className="sub">Cooking calmly since 2024</div>
        </div>
        <div style={{marginTop: 24}}>
          {rows.map((r, i) => (
            <div key={i} className="list-row">
              <span className="row-label">{r.label}</span>
              <span className="row-meta">{r.meta}</span>
              <ChevronRight size={16} style={{color:"var(--fg-3)"}}/>
            </div>
          ))}
        </div>
      </div>
      <TabBar active="profile" onTab={onTab}/>
    </div>
  );
}

/* ====================================================================
   BOTTOM TAB BAR
   ==================================================================== */
function TabBar({ active, onTab }) {
  const tabs = [
    { id: "home", icon: HomeIcon, label: "Home" },
    { id: "saved", icon: BookmarkIcon, label: "Saved" },
    { id: "cook", icon: ChefIcon, label: "Cook" },
    { id: "profile", icon: UserIcon, label: "Profile" }
  ];
  return (
    <nav className="tab-bar">
      {tabs.map(t => {
        const Ico = t.icon;
        return (
          <button key={t.id}
                  className={active === t.id ? "active" : ""}
                  onClick={() => onTab(t.id)}>
            <Ico size={22}/>
            <span className="label">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

Object.assign(window, {
  HomeScreen, RecipeDetail, CookMode, SavedScreen, ProfileScreen, TabBar
});
