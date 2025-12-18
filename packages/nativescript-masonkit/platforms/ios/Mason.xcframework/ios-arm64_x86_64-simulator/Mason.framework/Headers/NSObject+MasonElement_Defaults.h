//
//  NSObject+MasonElement_Defaults.h
//  Mason
//
//  Created by Osei Fortune on 20/10/2025.
//

#import <Foundation/Foundation.h>
#import <Mason/Mason-Swift.h>
NS_ASSUME_NONNULL_BEGIN

@interface NSObject (MasonElement_Defaults)<MasonElement>
-(void)objc_markNodeDirty;

-(BOOL)objc_isNodeDirty;

-(void)objc_configure:(void (^)(MasonStyle* style))block;

-(MasonLayout*)objc_layout;

-(void)objc_compute;


-(void)objc_computeWithWidth:(float)width height:(float)height;


-(void)objc_computeMaxContent;


-(void)objc_computeMinContent;


-(void)objc_computeWithSize:(float)width height:(float)height;


-(void)objc_computeWithViewSize;


-(void)objc_computeWithViewSizeAndLayout:(BOOL)layout;


-(void)objc_computeWithMaxContent;


-(void)objc_computeWithMinContent;


-(void)objc_attachAndApply;

-(void)objc_requestLayout;

-(void)objc_invalidateLayout;

-(void)objc_append:(id<MasonElement>)element;


-(void)objc_appendText:(NSString *)text;


-(void)objc_appendNode:(MasonNode *)node;


-(void)objc_appendTexts:(NSArray<NSString *> *)texts;


-(void)objc_appendElements:(NSArray<id<MasonElement>> *)elements;


-(void)objc_appendNodes:(NSArray<MasonNode*> *)nodes;


-(void)objc_prepend:(id<MasonElement>)element;


-(void)objc_prependText:(NSString *)text;


-(void)objc_prependNode:(MasonNode *)node;


-(void)objc_prependTexts:(NSArray<NSString *> *)texts;


-(void)objc_prependElements:(NSArray<id<MasonElement>> *)elements;


-(void)objc_prependNodes:(NSArray<MasonNode *> *)nodes;


- (void)objc_addChildAt:(id<MasonElement>)element atIndex:(NSInteger)index;


- (void)objc_addChildAtWithString:(NSString *)text atIndex:(NSInteger)index;


- (void)objc_addChildAtWithNode:(MasonNode *)node atIndex:(NSInteger)index;

@end

NS_ASSUME_NONNULL_END
