/* global React, ReactDOM, IOSDevice, HomeScreen, RecipeDetail, CookMode, SavedScreen, ProfileScreen, RECIPES, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSlider */

const { useState } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "gridLayout": "card",
  "photoRatio": "1 / 1",
  "titleSize": 14,
  "metaPadTop": 10,
  "metaPadBottom": 12,
  "gridGap": 12
}/*EDITMODE-END*/;

function App() {
  const [tab, setTab] = useState("home");
  const [recipe, setRecipe] = useState(null);
  const [cooking, setCooking] = useState(false);
  const [savedIds, setSavedIds] = useState(() => new Set([1, 4]));
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const toggleSave = (id) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openRecipe = (r) => { setRecipe(r); setCooking(false); };
  const back = () => setRecipe(null);
  const startCook = () => setCooking(true);
  const exitCook = () => setCooking(false);

  const onTab = (tt) => {
    setRecipe(null); setCooking(false); setTab(tt);
    if (tt === "cook") {
      const r = RECIPES[0];
      setRecipe(r); setCooking(true);
    }
  };

  const gridStyle = {
    "--grid-photo-ratio": t.photoRatio,
    "--grid-title-size": t.titleSize + "px",
    "--grid-sub-size": Math.max(10, t.titleSize - 3) + "px",
    "--grid-meta-padding": `${t.metaPadTop}px 12px ${t.metaPadBottom}px`,
    "--grid-gap": t.gridGap + "px",
  };

  let screen;
  if (cooking && recipe) {
    screen = <CookMode recipe={recipe} onExit={exitCook}/>;
  } else if (recipe) {
    screen = <RecipeDetail recipe={recipe} onBack={back}
                           onStartCook={startCook}
                           savedIds={savedIds} toggleSave={toggleSave}/>;
  } else if (tab === "saved") {
    screen = <SavedScreen savedIds={savedIds} toggleSave={toggleSave}
                          onOpenRecipe={openRecipe} onTab={onTab}/>;
  } else if (tab === "profile") {
    screen = <ProfileScreen onTab={onTab} savedCount={savedIds.size}/>;
  } else {
    screen = <HomeScreen onOpenRecipe={openRecipe}
                         savedIds={savedIds} toggleSave={toggleSave}
                         onTab={onTab}
                         gridLayout={t.gridLayout}
                         gridStyle={gridStyle}/>;
  }

  return (
    <div data-screen-label="Savor App" style={{display:"flex", justifyContent:"center", alignItems:"center", minHeight:"100vh", padding:"32px", background:"#EFE7DA"}}>
      <IOSDevice width={390} height={820}>
        {screen}
      </IOSDevice>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Top-8 grid" />
        <TweakRadio label="Layout"
                    value={t.gridLayout}
                    options={["card", "tight", "row"]}
                    onChange={v => setTweak('gridLayout', v)} />
        <TweakRadio label="Photo aspect"
                    value={t.photoRatio}
                    options={["1 / 1", "4 / 3", "16 / 9"]}
                    onChange={v => setTweak('photoRatio', v)} />
        <TweakSlider label="Title size" value={t.titleSize}
                     min={11} max={18} unit="px"
                     onChange={v => setTweak('titleSize', v)} />
        <TweakSlider label="Meta pad top" value={t.metaPadTop}
                     min={2} max={16} unit="px"
                     onChange={v => setTweak('metaPadTop', v)} />
        <TweakSlider label="Meta pad bottom" value={t.metaPadBottom}
                     min={2} max={16} unit="px"
                     onChange={v => setTweak('metaPadBottom', v)} />
        <TweakSlider label="Grid gap" value={t.gridGap}
                     min={0} max={20} unit="px"
                     onChange={v => setTweak('gridGap', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
