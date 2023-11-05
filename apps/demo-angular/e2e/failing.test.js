const { compareScreens } = require('./screenshots');
const { device } = require('detox');

beforeEach(async () => {
  await device.launchApp({ newInstance: true });
});

describe('FAILING TESTS', () => {
  it('TEST ALL', async () => {
    console.log('79:FLEX BASIS UNCONSTRAINT COLUMN');
    await element(by.text('79')).tap();
    await compareScreens(element(by.id('test-root')), '79');
    await element(by.id('flex_basis')).tap();

    console.log('80:FLEX BASIS UNCONSTRAINT ROW');
    await element(by.text('80')).tap();
    await compareScreens(element(by.id('test-root')), '80');
    await element(by.id('flex_basis')).tap();

    console.log('87:FLEX GROW CHILD');
    await element(by.text('87')).tap();
    await compareScreens(element(by.id('test-root')), '87');
    await element(by.id('flex_grow_')).tap();

    console.log('95:FLEX GROW WITHIN CONSTRAINED MAX COLUMN');
    await element(by.text('95')).tap();
    await compareScreens(element(by.id('test-root')), '95');
    await element(by.id('flex_grow_')).tap();

    console.log('98:FLEX GROW WITHIN CONSTRAINED MIN COLUMN');
    await element(by.text('98')).tap();
    await compareScreens(element(by.id('test-root')), '98');
    await element(by.id('flex_grow_')).tap();

    console.log('99:FLEX GROW WITHIN CONSTRAINED MIN MAX COLUMN');
    await element(by.text('99')).tap();
    await compareScreens(element(by.id('test-root')), '99');
    await element(by.id('flex_grow_')).tap();

    console.log('103:FLEX SHRINK BY OUTER MARGIN WITH MAX SIZE');
    await element(by.text('103')).tap();
    await compareScreens(element(by.id('test-root')), '103');
    await element(by.id('flex_shrin')).tap();

    console.log('178:GRID AUTO COLUMNS FIXED WIDTH');
    await element(by.text('178')).tap();
    await compareScreens(element(by.id('test-root')), '178');
    await element(by.id('grid_auto_')).tap();

    console.log('182:GRID AUTO SINGLE ITEM');
    await element(by.text('182')).tap();
    await compareScreens(element(by.id('test-root')), '182');
    await element(by.id('grid_auto_')).tap();

    console.log('183:GRID AUTO SINGLE ITEM FIXED WIDTH');
    await element(by.text('183')).tap();
    await compareScreens(element(by.id('test-root')), '183');
    await element(by.id('grid_auto_')).tap();

    console.log('184:GRID AUTO SINGLE ITEM FIXED WIDTH WITH DEFINITE WIDTH');
    await element(by.text('184')).tap();
    await compareScreens(element(by.id('test-root')), '184');
    await element(by.id('grid_auto_')).tap();

    console.log('192:GRID FR AUTO NO SIZED ITEMS');
    await element(by.text('192')).tap();
    await compareScreens(element(by.id('test-root')), '192');
    await element(by.id('grid_fr_au')).tap();

    console.log('193:GRID FR AUTO SINGLE ITEM');
    await element(by.text('193')).tap();
    await compareScreens(element(by.id('test-root')), '193');
    await element(by.id('grid_fr_au')).tap();

    console.log('238:GRID MIN MAX COLUMN AUTO');
    await element(by.text('238')).tap();
    await compareScreens(element(by.id('test-root')), '238');
    await element(by.id('grid_min_m')).tap();

    // Grid do not get distributed into rows automatically...
    console.log('239:GRID MIN MAX COLUMN FIXED WIDTH ABOVE RANGE');
    await element(by.text('239')).tap();
    await compareScreens(element(by.id('test-root')), '239');
    await element(by.id('grid_min_m')).tap();

    // Grid do not get distributed into rows automatically...
    console.log('240:GRID MIN MAX COLUMN FIXED WIDTH BELOW RANGE');
    await element(by.text('240')).tap();
    await compareScreens(element(by.id('test-root')), '240');
    await element(by.id('grid_min_m')).tap();

    // Grid do not get distributed into rows automatically...
    console.log('241:GRID MIN MAX COLUMN FIXED WIDTH WITHIN RANGE');
    await element(by.text('241')).tap();
    await compareScreens(element(by.id('test-root')), '241');
    await element(by.id('grid_min_m')).tap();

    // Crashes
    // console.log('242:GRID OUT OF ORDER ITEMS');
    // await element(by.text('242')).tap();
    // await compareScreens(element(by.id('test-root')), '242');
    // await element(by.id('grid_out_o')).tap();

    console.log('247:GRID PERCENT TRACKS DEFINITE OVERFLOW');
    await element(by.text('247')).tap();
    await compareScreens(element(by.id('test-root')), '247');
    await element(by.id('grid_perce')).tap();

    // Nothing renders because no width/height is set on the grid...
    console.log('249:GRID PERCENT TRACKS INDEFINITE ONLY');
    await element(by.text('249')).tap();
    await compareScreens(element(by.id('test-root')), '249');
    await element(by.id('grid_perce')).tap();

    console.log('271:JUSTIFY CONTENT ROW MAX WIDTH AND MARGIN');
    await element(by.text('271')).tap();
    await compareScreens(element(by.id('test-root')), '271');
    await element(by.id('justify_co')).tap();

    console.log('308:MAX HEIGHT OVERRIDES HEIGHT');
    await element(by.text('308')).tap();
    await compareScreens(element(by.id('test-root')), '308');
    await element(by.id('max_height')).tap();

    console.log('309:MAX HEIGHT OVERRIDES HEIGHT ON ROOT');
    await element(by.text('309')).tap();
    await compareScreens(element(by.id('test-root')), '309');
    await element(by.id('max_height')).tap();

    console.log('311:MAX WIDTH OVERRIDES WIDTH');
    await element(by.text('311')).tap();
    await compareScreens(element(by.id('test-root')), '311');
    await element(by.id('max_width_')).tap();

    console.log('312:MAX WIDTH OVERRIDES WIDTH ON ROOT');
    await element(by.text('312')).tap();
    await compareScreens(element(by.id('test-root')), '312');
    await element(by.id('max_width_')).tap();

    console.log('324:MEASURE ROOT');
    await element(by.text('324')).tap();
    await compareScreens(element(by.id('test-root')), '324');
    await element(by.id('measure_ro')).tap();

    console.log('328:MIN HEIGHT OVERRIDES HEIGHT');
    await element(by.text('328')).tap();
    await compareScreens(element(by.id('test-root')), '328');
    await element(by.id('min_height')).tap();

    console.log('329:MIN HEIGHT OVERRIDES HEIGHT ON ROOT');
    await element(by.text('329')).tap();
    await compareScreens(element(by.id('test-root')), '329');
    await element(by.id('min_height')).tap();

    console.log('330:MIN HEIGHT OVERRIDES MAX HEIGHT');
    await element(by.text('330')).tap();
    await compareScreens(element(by.id('test-root')), '330');
    await element(by.id('min_height')).tap();

    console.log('333:MIN WIDTH OVERRIDES MAX WIDTH');
    await element(by.text('333')).tap();
    await compareScreens(element(by.id('test-root')), '333');
    await element(by.id('min_width_')).tap();

    console.log('334:MIN WIDTH OVERRIDES WIDTH');
    await element(by.text('334')).tap();
    await compareScreens(element(by.id('test-root')), '334');
    await element(by.id('min_width_')).tap();

    console.log('335:MIN WIDTH OVERRIDES WIDTH ON ROOT');
    await element(by.text('335')).tap();
    await compareScreens(element(by.id('test-root')), '335');
    await element(by.id('min_width_')).tap();

    console.log('343:PADDING NO CHILD');
    await element(by.text('343')).tap();
    await compareScreens(element(by.id('test-root')), '343');
    await element(by.id('padding_no')).tap();

    console.log('368:PERCENTAGE WIDTH HEIGHT UNDEFINED PARENT SIZE');
    await element(by.text('368')).tap();
    await compareScreens(element(by.id('test-root')), '368');
    await element(by.id('percentage')).tap();

    console.log('386:WIDTH SMALLER THEN CONTENT WITH FLEX GROW UNCONSTRAINT SIZE');
    await element(by.text('386')).tap();
    await compareScreens(element(by.id('test-root')), '386');
    await element(by.id('width_smal')).tap();
  });
});
